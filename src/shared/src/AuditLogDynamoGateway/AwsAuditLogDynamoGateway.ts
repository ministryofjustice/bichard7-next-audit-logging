import { addDays } from "date-fns"
import type {
  AuditLog,
  AuditLogDynamoGateway,
  AuditLogEvent,
  DynamoDbConfig,
  DynamoUpdate,
  KeyValuePair,
  PromiseResult
} from "shared-types"
import { EventType, isError } from "shared-types"
import type { FetchByIndexOptions, UpdateOptions } from "../DynamoGateway"
import { DynamoGateway, IndexSearcher, KeyComparison } from "../DynamoGateway"
import CalculateMessageStatusUseCase from "./CalculateMessageStatusUseCase"
import getForceOwnerForAutomationReport from "./getForceOwnerForAutomationReport"
import shouldLogForAutomationReport from "./shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "./shouldLogForTopExceptionsReport"
import maxBy from "lodash.maxby"
import minBy from "lodash.minby"

export default class AwsAuditLogDynamoGateway extends DynamoGateway implements AuditLogDynamoGateway {
  private readonly tableKey: string = "messageId"

  private readonly sortKey: string = "receivedDate"

  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  async create(message: AuditLog): PromiseResult<AuditLog> {
    if (process.env.IS_E2E) {
      message.expiryTime = Math.round(
        addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
      ).toString()
    }

    const result = await this.insertOne(this.tableName, message, this.tableKey)

    if (isError(result)) {
      return result
    }

    return message
  }

  async createMany(messages: AuditLog[]): PromiseResult<AuditLog[]> {
    if (process.env.IS_E2E) {
      messages.map((message) => {
        message.expiryTime = Math.round(
          addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
        ).toString()
      })
    }

    const result = await this.insertMany(this.tableName, messages, "messageId")

    if (isError(result)) {
      return result
    }

    return messages
  }

  async update(message: AuditLog): PromiseResult<AuditLog> {
    message.status = new CalculateMessageStatusUseCase(message.events).call()

    message.errorRecordArchivalDate =
      message.errorRecordArchivalDate ??
      message.events.find((event) => event.eventType === EventType.ErrorRecordArchival)?.timestamp
    message.isSanitised = message.events.find((event) => event.eventType === EventType.SanitisedMessage) ? 1 : 0

    const updateResult = await this.updateOne(this.tableName, message, "messageId", message.version)
    if (isError(updateResult)) {
      return updateResult
    }

    const newVersionResult = await this.fetchVersion(message.messageId)
    if (isError(newVersionResult)) {
      return newVersionResult
    }
    if (newVersionResult === null) {
      return Error(`Message with id ${message.messageId} was not found in the database`)
    }

    // Remove nextSanitiseCheck if the message is already sanitised
    if (message.isSanitised) {
      const options: UpdateOptions = {
        keyName: this.tableKey,
        keyValue: message.messageId,
        updateExpression: "REMOVE nextSanitiseCheck",
        updateExpressionValues: {},
        currentVersion: newVersionResult
      }

      const removeSanitiseCheckResult = await this.updateEntry(this.tableName, options)
      if (isError(removeSanitiseCheckResult)) {
        return removeSanitiseCheckResult
      }
    }

    return message
  }

  async updateSanitiseCheck(message: AuditLog, nextSanitiseCheck: Date): PromiseResult<void> {
    const options: UpdateOptions = {
      keyName: this.tableKey,
      keyValue: message.messageId,
      updateExpression: "SET nextSanitiseCheck = :value",
      updateExpressionValues: { ":value": nextSanitiseCheck.toISOString() },
      currentVersion: message.version
    }
    const result = await this.updateEntry(this.tableName, options)
    if (isError(result)) {
      return result
    }
  }

  async fetchMany(limit = 10, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
      .useIndex(`${this.sortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .paginate(limit, lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
    const options: FetchByIndexOptions = {
      indexName: "externalCorrelationIdIndex",
      hashKeyName: "externalCorrelationId",
      hashKeyValue: externalCorrelationId,
      pagination: { limit: 1 }
    }

    const result = await this.fetchByIndex(this.tableName, options)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return null
    }

    const items = <AuditLog[]>result?.Items
    return items[0]
  }

  async fetchByHash(hash: string): PromiseResult<AuditLog | null> {
    const options: FetchByIndexOptions = {
      indexName: "messageHashIndex",
      hashKeyName: "messageHash",
      hashKeyValue: hash,
      pagination: { limit: 1 }
    }

    const result = await this.fetchByIndex(this.tableName, options)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return null
    }

    const items = <AuditLog[]>result?.Items
    return items[0]
  }

  async fetchByStatus(status: string, limit = 10, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
      .useIndex("statusIndex")
      .setIndexKeys("status", status, "receivedDate")
      .paginate(limit, lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchUnsanitised(limit = 10, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
      .useIndex("isSanitisedIndex")
      .setIndexKeys("isSanitised", 0, "nextSanitiseCheck", new Date().toISOString(), KeyComparison.LessThanOrEqual)
      .paginate(limit, lastMessage, true)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchOne(messageId: string): PromiseResult<AuditLog> {
    const result = await this.getOne(this.tableName, this.tableKey, messageId)

    if (isError(result)) {
      return result
    }

    return result?.Item as AuditLog
  }

  async fetchVersion(messageId: string): PromiseResult<number | null> {
    const result = await this.getRecordVersion(this.tableName, this.tableKey, messageId)

    if (isError(result)) {
      return result
    }

    const auditLog = result?.Item as AuditLog

    return auditLog ? auditLog.version : null
  }

  async fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]> {
    const result = await this.fetchOne(messageId)

    if (isError(result)) {
      return result
    }

    if (!result) {
      return new Error(`Couldn't get events for message '${messageId}'.`)
    }

    if (!result.events) {
      return []
    }

    return result.events
  }

  async addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void> {
    const dynamoUpdate = await this.prepare(messageId, messageVersion, event)
    if (isError(dynamoUpdate)) {
      return dynamoUpdate
    }

    const result = await this.executeTransaction([dynamoUpdate])

    if (isError(result)) {
      return result
    }

    return undefined
  }

  prepare(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<DynamoUpdate> {
    return this.prepareEvents(messageId, messageVersion, [event])
  }

  async prepareEvents(messageId: string, messageVersion: number, events: AuditLogEvent[]): PromiseResult<DynamoUpdate> {
    const currentEvents = await this.fetchEvents(messageId)
    if (isError(currentEvents)) {
      return currentEvents
    }

    // Add events to the array and set last event type
    let updateExpression = `
      set events = list_append(if_not_exists(events, :empty_list), :events),
      #lastEventType = :lastEventType
    `
    const expressionAttributeNames: KeyValuePair<string, string> = {
      "#lastEventType": "lastEventType"
    }
    const lastEventType = maxBy(events, (event) => event.timestamp)?.eventType
    const updateExpressionValues: KeyValuePair<string, unknown> = {
      ":events": events,
      ":empty_list": <AuditLogEvent[]>[],
      ":lastEventType": lastEventType
    }

    // Calculate which force owns this message for reports
    const forceOwnerEvents = events.filter((event) => getForceOwnerForAutomationReport(event))
    const forceOwnerEventForAutomationReport = maxBy(forceOwnerEvents, (event) => event.timestamp)
    if (forceOwnerEventForAutomationReport) {
      updateExpressionValues[":forceOwner"] = getForceOwnerForAutomationReport(forceOwnerEventForAutomationReport)
      updateExpression += ", automationReport.forceOwner = :forceOwner"
    }

    // Set the status if it changed
    const status = new CalculateMessageStatusUseCase(...events, ...currentEvents).call()
    if (status) {
      expressionAttributeNames["#status"] = "status"
      updateExpressionValues[":status"] = status
      updateExpression += ", #status = :status"
    }

    // Add events relevant to reports to those arrays
    const topExceptionsReportEvents = events.filter((event) => shouldLogForTopExceptionsReport(event))
    if (topExceptionsReportEvents.length > 0) {
      updateExpressionValues[":topExceptionEvents"] = topExceptionsReportEvents
      updateExpression +=
        ", topExceptionsReport.events = list_append(if_not_exists(topExceptionsReport.events, :empty_list), :topExceptionEvents)"
    }
    const automationReportEvents = events.filter((event) => shouldLogForAutomationReport(event))
    if (automationReportEvents.length > 0) {
      updateExpressionValues[":automationReportEvents"] = automationReportEvents
      updateExpression +=
        ", automationReport.events = list_append(if_not_exists(automationReport.events, :empty_list), :automationReportEvents)"
    }

    // Mark the message as archived if we're adding an archival event
    const archivalEvents = events.filter((event) => event.eventType === EventType.ErrorRecordArchival)
    if (archivalEvents.length > 0) {
      expressionAttributeNames["#errorRecordArchivalDate"] = "errorRecordArchivalDate"
      updateExpressionValues[":errorRecordArchivalDate"] = minBy(archivalEvents, (event) => event.timestamp)?.timestamp
      updateExpression += ", #errorRecordArchivalDate = :errorRecordArchivalDate"
    }

    // Mark the message as sanitised if we're adding an archival event
    const sanitisationEvents = events.filter((event) => event.eventType === EventType.SanitisedMessage)
    if (sanitisationEvents.length > 0) {
      expressionAttributeNames["#isSanitised"] = "isSanitised"
      updateExpressionValues[":isSanitised"] = 1
      updateExpression += ", #isSanitised = :isSanitised"
    }

    // Increment retry count if we're adding a retry event
    const retryingEvents = events.filter((event) => event.eventType === EventType.Retrying)
    if (retryingEvents.length > 0) {
      updateExpressionValues[":zero"] = 0
      updateExpressionValues[":retryCount"] = retryingEvents.length
      updateExpression += ", retryCount = if_not_exists(retryCounter, :zero) + :retryCount"
    }

    return {
      Update: {
        TableName: this.tableName,
        Key: {
          messageId: messageId
        },
        UpdateExpression: updateExpression + " ADD version :version_increment",
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: { ...updateExpressionValues, ":version": messageVersion, ":version_increment": 1 },
        ConditionExpression: `attribute_exists(${this.tableKey}) AND version = :version`
      }
    }
  }
}
