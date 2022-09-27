import type { AuditLogEvent, AuditLogDynamoGateway, CreateAuditLogEventsResult, DynamoUpdate } from "shared-types"
import { isError } from "shared-types"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"
import { isConditionalExpressionViolationError } from "shared"

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

export default class CreateAuditLogEventUseCase {
  constructor(
    private readonly auditLogGateway: AuditLogDynamoGateway,
    private readonly storeValuesInLookupTableUseCase: StoreValuesInLookupTableUseCase
  ) {}

  async create(messageId: string, originalEvent: AuditLogEvent): Promise<CreateAuditLogEventsResult> {
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

    if (shouldDeduplicate(originalEvent)) {
      const message = await this.auditLogGateway.fetchOne(messageId)

      if (isError(message)) {
        return {
          resultType: "error",
          resultDescription: message.message
        }
      }

      if (isDuplicateEvent(originalEvent, message.events)) {
        return {
          resultType: "success"
        }
      }
    }

    const dynamoUpdates: DynamoUpdate[] = []

    const lookupPrepareResult = await this.storeValuesInLookupTableUseCase.prepare(originalEvent, messageId)

    if (isError(lookupPrepareResult)) {
      return {
        resultType: "error",
        resultDescription: `Couldn't save attribute value in lookup table. ${lookupPrepareResult.message}`
      }
    }

    const [lookupDynamoUpdates, updatedEvent] = lookupPrepareResult
    dynamoUpdates.push(...lookupDynamoUpdates)

    const auditLogDynamoUpdate = await this.auditLogGateway.prepare(messageId, messageVersion, updatedEvent)

    if (isError(auditLogDynamoUpdate)) {
      return {
        resultType: "error",
        resultDescription: auditLogDynamoUpdate.message
      }
    } else {
      dynamoUpdates.push(auditLogDynamoUpdate)
    }

    const transactionResult = await this.auditLogGateway.executeTransaction(dynamoUpdates)

    if (isError(transactionResult)) {
      if (isConditionalExpressionViolationError(transactionResult)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
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
