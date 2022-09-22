import type { AuditLogEvent, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError } from "../utils"
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

    const eventsToAdd = []
    const deduplicatedEvents = originalEvents.filter(
      (event) => !(shouldDeduplicate(event) && isDuplicateEvent(event, message.events))
    )
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
    // TODO: check for duplicate messages in the batch were adding
    const addEventsTransactionParams = await this.auditLogGateway.prepareEvents(
      messageId,
      messageVersion,
      deduplicatedEvents
    )

    if (isError(addEventsTransactionParams) && isConditionalExpressionViolationError(addEventsTransactionParams)) {
      return {
        resultType: "invalidVersion",
        resultDescription: `Message with Id ${messageId} has a different version in the database.`
      }
      // TODO handle the case the error is not a conditional expression violation error
    }

    // TODO check number of transaction items is below dynamodb limit
    const transactionResult = this.auditLogGateway.executeTransaction(
      ...transactionActions,
      addEventsTransactionParams as DocumentClient.TransactWriteItem
    )

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
