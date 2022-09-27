import type { AuditLogEvent, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError, isTooManyEventsError } from "shared"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"
import type { DocumentClient } from "aws-sdk/clients/dynamodb"

interface CreateAuditLogEventsResult {
  resultType: "success" | "notFound" | "invalidVersion" | "transactionFailed" | "error" | "tooManyEvents"
  resultDescription?: string
}

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
    private readonly auditLogGateway: AuditLogDynamoGateway,
    private readonly storeValuesInLookupTableUseCase: StoreValuesInLookupTableUseCase
  ) {}

  async create(messageId: string, originalEvents: AuditLogEvent[]): Promise<CreateAuditLogEventsResult> {
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

    const message = await this.auditLogGateway.fetchOne(messageId)

    if (isError(message)) {
      return {
        resultType: "error",
        resultDescription: message.message
      }
    }

    const currentEvents = await this.auditLogGateway.fetchEvents(messageId)
    if (isError(currentEvents)) {
      return {
        resultType: "error",
        resultDescription: currentEvents.message
      }
    }

    const deduplicatedEvents = []
    for (const event of originalEvents) {
      if (shouldDeduplicate(event) && isDuplicateEvent(event, [...message.events, ...deduplicatedEvents])) {
        continue
      }
      deduplicatedEvents.push(event)
    }

    const eventsToAdd: AuditLogEvent[] = []
    const transactionActions = (
      await Promise.all(
        deduplicatedEvents.map(async (originalEvent) => {
          const lookupPrepareResult = await this.storeValuesInLookupTableUseCase.prepare(originalEvent, messageId)

          const [lookupTransactionParams, updatedEvent] = lookupPrepareResult
          eventsToAdd.push(updatedEvent)

          return lookupTransactionParams
        })
      )
    ).flat()

    const addEventsTransactionParams = await this.auditLogGateway.prepareEvents(messageId, messageVersion, eventsToAdd)

    if (isError(addEventsTransactionParams)) {
      return {
        resultType: "error",
        resultDescription: addEventsTransactionParams.message
      }
    }

    const transactionResult = await this.auditLogGateway.executeTransaction([
      ...transactionActions,
      addEventsTransactionParams as DocumentClient.TransactWriteItem
    ])

    if (isError(transactionResult)) {
      if (isConditionalExpressionViolationError(transactionResult)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
        }
      }
      const [errorIsTooManyEventsError, tooManyEventsMessage] = isTooManyEventsError(transactionResult)
      if (errorIsTooManyEventsError) {
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
