import type { AuditLogEvent, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError } from "../utils"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"
import type { DocumentClient } from "aws-sdk/clients/dynamodb"

interface CreateAuditLogEventResult {
  resultType: "success" | "notFound" | "invalidVersion" | "transactionFailed" | "error"
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

export default class CreateAuditLogEventUseCase {
  constructor(
    private readonly auditLogGateway: AuditLogDynamoGateway,
    private readonly storeValuesInLookupTableUseCase: StoreValuesInLookupTableUseCase
  ) {}

  async create(messageId: string, originalEvent: AuditLogEvent): Promise<CreateAuditLogEventResult> {
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

    const transactionActions: DocumentClient.TransactWriteItem[] = []

    const lookupPrepareResult = await this.storeValuesInLookupTableUseCase.prepare(originalEvent, messageId)

    if (isError(lookupPrepareResult)) {
      return {
        resultType: "error",
        resultDescription: `Couldn't save attribute value in lookup table. ${lookupPrepareResult.message}`
      }
    }

    const [lookupTransactionParams, updatedEvent] = lookupPrepareResult
    transactionActions.push(...lookupTransactionParams)

    const addEventsTransactionParams = await this.auditLogGateway.prepare(messageId, messageVersion, updatedEvent)

    if (isError(addEventsTransactionParams)) {
      if (isConditionalExpressionViolationError(addEventsTransactionParams)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
        }
      }
      // TODO handle the case the error is not a conditional expression violation error
    } else {
      transactionActions.push(addEventsTransactionParams)
    }

    const transactionResult = await this.auditLogGateway.executeTransaction(transactionActions)

    if (isError(transactionResult)) {
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
