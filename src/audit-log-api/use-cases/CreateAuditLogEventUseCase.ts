import type { AuditLogEvent, CreateAuditLogEventsResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { isConditionalExpressionViolationError, isTransactionConflictError } from "../gateways/dynamo"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"

const retryAttempts = 10

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
    private readonly auditLogGateway: AuditLogDynamoGatewayInterface,
    private readonly storeValuesInLookupTableUseCase: StoreValuesInLookupTableUseCase
  ) {}

  async create(
    messageId: string,
    originalEvent: AuditLogEvent,
    attempts = retryAttempts
  ): Promise<CreateAuditLogEventsResult> {
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

      // Nothing to add for duplicate events
      if (isDuplicateEvent(originalEvent, message.events)) {
        return {
          resultType: "success"
        }
      }
    }

    // Store long attribute values in the lookup table
    const [dynamoUpdates, updatedEvent] = await this.storeValuesInLookupTableUseCase.prepare(originalEvent, messageId)

    // Add the event to the audit log table entry
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
      if (isConditionalExpressionViolationError(transactionResult) || isTransactionConflictError(transactionResult)) {
        if (attempts > 1) {
          // Wait 250 - 750ms and try again
          const delay = Math.floor(250 + Math.random() * 500)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.create(messageId, originalEvent, attempts - 1)
        }
        return {
          resultType: "transactionFailed",
          resultDescription: `Conflict writing event to message with Id ${messageId}. Tried ${retryAttempts} times`
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
