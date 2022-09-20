import type { AuditLogEvent, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError } from "../utils"
import type StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"

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

    const event = await this.storeValuesInLookupTableUseCase.execute(originalEvent, messageId)
    if (isError(event)) {
      return {
        resultType: "error",
        resultDescription: `Couldn't save attribute value in lookup table. ${event.message}`
      }
    }

    const result = await this.auditLogGateway.addEvent(messageId, messageVersion, event)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
        }
      }

      return {
        resultType: "error",
        resultDescription: result.message
      }
    }

    return {
      resultType: "success"
    }
  }
}
