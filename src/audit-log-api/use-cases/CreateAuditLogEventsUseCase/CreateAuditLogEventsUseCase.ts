import type { AuditLogEvent, CreateAuditLogEventsResult } from "src/shared/types"
import { isError } from "src/shared/types"
import { NotFoundError } from "src/shared/types/ApplicationError"
import type { AuditLogDynamoGatewayInterface } from "../../gateways/dynamo"
import {
  isConditionalExpressionViolationError,
  isTooManyEventsError,
  isTransactionConflictError
} from "../../gateways/dynamo"
import calculateErrorRecordArchivalDate from "./calculateErrorRecordArchivalDate"
import calculateForceOwner from "./calculateForceOwner"
import calculateIsSanitised from "./calculateIsSanitised"
import calculateRetryCount from "./calculateRetryCount"
import calculateStatuses from "./calculateStatuses"

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

const filterDuplicateEvents = (existingEvents: AuditLogEvent[]) => {
  const deduplicatedNewEvents: AuditLogEvent[] = []
  return (event: AuditLogEvent): boolean => {
    if (!shouldDeduplicate(event)) {
      deduplicatedNewEvents.push(event)
      return true
    }

    const result = !isDuplicateEvent(event, [...existingEvents, ...deduplicatedNewEvents])
    if (result) {
      deduplicatedNewEvents.push(event)
    }

    return result
  }
}

export default class CreateAuditLogEventsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  async create(
    messageId: string,
    events: AuditLogEvent[] | AuditLogEvent,
    attempts = retryAttempts
  ): Promise<CreateAuditLogEventsResult> {
    const newEvents = Array.isArray(events) ? events : [events]
    const message = await this.auditLogGateway.fetchOne(messageId, { includeColumns: ["version"] })

    if (isError(message)) {
      return {
        resultType: "error",
        resultDescription: message.message
      }
    }

    if (!message) {
      return {
        resultType: "notFound",
        resultDescription: `A message with Id ${messageId} does not exist in the database`
      }
    }

    const allEvents = newEvents.concat(message.events ?? [])
    const deduplicatedNewEvents = newEvents.filter(filterDuplicateEvents(message.events ?? []))

    if (deduplicatedNewEvents.length === 0) {
      return {
        resultType: "success"
      }
    }

    const updates = {
      ...calculateForceOwner(allEvents),
      ...calculateStatuses(allEvents),
      ...calculateErrorRecordArchivalDate(allEvents),
      ...calculateIsSanitised(allEvents),
      ...calculateRetryCount(allEvents),
      events: deduplicatedNewEvents
    }

    const transactionResult = await this.auditLogGateway.update(message, updates, deduplicatedNewEvents)

    if (isError(transactionResult)) {
      if (isConditionalExpressionViolationError(transactionResult) || isTransactionConflictError(transactionResult)) {
        if (attempts > 1) {
          console.log("Retrying ", attempts)
          // Wait 250 - 750ms and try again
          const delay = Math.floor(250 + Math.random() * 500)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.create(messageId, events, attempts - 1)
        }
        return {
          resultType: "transactionFailed",
          resultDescription: `Conflict writing event to message with Id ${messageId}. Tried ${retryAttempts} times`
        }
      } else if (transactionResult instanceof NotFoundError) {
        return {
          resultType: "notFound",
          resultDescription: `A message with Id ${messageId} does not exist in the database`
        }
      }

      if (isTooManyEventsError(transactionResult)) {
        return {
          resultType: "tooManyEvents",
          resultDescription: "Too many actions for a dynamodb transaction: " + transactionResult.message
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