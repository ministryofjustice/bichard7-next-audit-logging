import type { AuditLogEvent, CreateAuditLogEventsResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface, DynamoUpdate } from "../gateways/dynamo"
import { isConditionalExpressionViolationError, isTooManyEventsError } from "../gateways/dynamo"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"

const shouldDeduplicate = (event: AuditLogEvent): boolean =>
  event.category === "error" &&
  event.attributes &&
  event.attributes.hasOwnProperty("Exception Message") &&
  event.attributes.hasOwnProperty("Exception Stack Trace")

const stackTraceFirstLine = (stackTrace: string): string => stackTrace.split("\n")[0].trim()

const isDuplicateEvent = (event: AuditLogEvent, existingEvents: AuditLogEvent[]): boolean => {
  if (existingEvents.length === 0) {
    return false
  }
  const lastEvent = existingEvents[existingEvents.length - 1]
  if (lastEvent && lastEvent.attributes["Exception Message"] === event.attributes["Exception Message"]) {
    if (
      typeof lastEvent.attributes["Exception Stack Trace"] === "string" &&
      typeof event.attributes["Exception Stack Trace"] === "string"
    ) {
      const previousStacktrace: string = lastEvent.attributes["Exception Stack Trace"] as string
      const thisStacktrace: string = event.attributes["Exception Stack Trace"] as string

      if (stackTraceFirstLine(previousStacktrace) === stackTraceFirstLine(thisStacktrace)) {
        return true
      }
    }
  }
  return false
}

export default class CreateAuditLogEventsUseCase {
  constructor(
    private readonly auditLogGateway: AuditLogDynamoGatewayInterface,
    private readonly storeValuesInLookupTableUseCase: StoreValuesInLookupTableUseCase
  ) {}

  async create(messageId: string, inputEvents: AuditLogEvent[]): Promise<CreateAuditLogEventsResult> {
    const messageVersion = await this.auditLogGateway.fetchVersion(messageId)

    if (isError(messageVersion)) {
      return {
        resultType: "error",
        resultDescription: messageVersion.message
      }
    }

    if (messageVersion === null) {
      return {
        resultType: "notFound",
        resultDescription: `A message with Id ${messageId} does not exist in the database`
      }
    }

    const originalEvents = await this.auditLogGateway.fetchEvents(messageId)

    if (isError(originalEvents)) {
      return {
        resultType: "error",
        resultDescription: originalEvents.message
      }
    }

    // Remove duplicate events which we aren't going to add
    const deduplicatedInputEvents = []
    for (const event of inputEvents) {
      if (shouldDeduplicate(event) && isDuplicateEvent(event, [...originalEvents, ...deduplicatedInputEvents])) {
        continue
      }
      deduplicatedInputEvents.push(event)
    }

    if (deduplicatedInputEvents.length < 1) {
      return {
        resultType: "success",
        resultDescription: "nothing to add"
      }
    }

    // Store long attribute values in the lookup table
    const preparedEvents: AuditLogEvent[] = []
    const lookupDynamoUpdates = (
      await Promise.all(
        deduplicatedInputEvents.map(async (event) => {
          const [lookupDynamoUpdate, preparedEvent] = await this.storeValuesInLookupTableUseCase.prepare(
            event,
            messageId
          )
          preparedEvents.push(preparedEvent)

          return lookupDynamoUpdate
        })
      )
    ).flat()

    // Add the events to the audit log table entry
    const auditLogDynamoUpdate = await this.auditLogGateway.prepareEvents(messageId, messageVersion, preparedEvents)

    if (isError(auditLogDynamoUpdate)) {
      return {
        resultType: "error",
        resultDescription: auditLogDynamoUpdate.message
      }
    }

    const transactionResult = await this.auditLogGateway.executeTransaction([
      ...lookupDynamoUpdates,
      auditLogDynamoUpdate as DynamoUpdate
    ])

    if (isError(transactionResult)) {
      if (isConditionalExpressionViolationError(transactionResult)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
        }
      }
      const [errorIsTooManyEvents, tooManyEventsMessage] = isTooManyEventsError(transactionResult)
      if (errorIsTooManyEvents) {
        return {
          resultType: "tooManyEvents",
          resultDescription: "Too many actions for a dynamodb transaction: " + tooManyEventsMessage
        }
      }

      return {
        resultType: "transactionFailed",
        resultDescription: transactionResult.message
      }
    }

    return {
      resultType: "success"
    }
  }
}
