import type {
  AuditLog,
  AuditLogDynamoGateway,
  AuditLogEvent,
  DynamoDbConfig,
  KeyValuePair,
  PromiseResult
} from "shared-types"
import { EventType, isError } from "shared-types"
import type { FetchByIndexOptions, UpdateOptions, UnconditionalUpdateOptions } from "../DynamoGateway"
import { DynamoGateway, IndexSearcher, KeyComparison } from "../DynamoGateway"
import CalculateMessageStatusUseCase from "./CalculateMessageStatusUseCase"
import getForceOwnerForAutomationReport from "./getForceOwnerForAutomationReport"
import shouldLogForAutomationReport from "./shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "./shouldLogForTopExceptionsReport"

export default class AwsAuditLogDynamoGateway extends DynamoGateway implements AuditLogDynamoGateway {
  private readonly tableKey: string = "messageId"

  private readonly sortKey: string = "receivedDate"

  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  async create(message: AuditLog): PromiseResult<AuditLog> {
    const result = await this.insertOne(this.tableName, message, "messageId")

    if (isError(result)) {
      return result
    }

    return message
  }

  async update(message: AuditLog): PromiseResult<AuditLog> {
    message.status = new CalculateMessageStatusUseCase(message.events).call()

    message.errorRecordArchivalDate =
      message.errorRecordArchivalDate ??
      message.events.find((event) => event.eventType === EventType.ErrorRecordArchival)?.timestamp
    message.isSanitised = message.events.find((event) => event.eventType === EventType.SanitisedMessage) ? 1 : 0

    const result = await this.updateOne(this.tableName, message, "messageId", message.version)

    if (isError(result)) {
      return result
    }

    return message
  }

  async updateSanitiseCheck(messageId: string, nextSanitiseCheck: Date): PromiseResult<void> {
    const options: UnconditionalUpdateOptions = {
      keyName: this.tableKey,
      keyValue: messageId,
      updateExpression: "SET nextSanitiseCheck = :value",
      updateExpressionValues: { ":value": nextSanitiseCheck.toISOString() }
    }
    const result = await this.updateEntryUnconditionally(this.tableName, options)
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
      .setAscendingOrder(true)
      .paginate(limit, lastMessage)
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
    const events = await this.fetchEvents(messageId)
    if (isError(events)) {
      return events
    }

    const status = new CalculateMessageStatusUseCase(events, event).call()

    const expressionAttributeNames: KeyValuePair<string, string> = {
      "#lastEventType": "lastEventType"
    }
    const updateExpressionValues: KeyValuePair<string, unknown> = {
      ":event": [event],
      ":empty_list": <AuditLogEvent[]>[],
      ":lastEventType": event.eventType
    }
    let updateExpression = `
      set events = list_append(if_not_exists(events, :empty_list), :event),
      #lastEventType = :lastEventType
    `

    const forceOwnerForAutomationReport = getForceOwnerForAutomationReport(event)
    if (forceOwnerForAutomationReport) {
      updateExpressionValues[":forceOwner"] = forceOwnerForAutomationReport
      updateExpression = `${updateExpression}, automationReport.forceOwner = :forceOwner`
    }

    if (shouldLogForTopExceptionsReport(event)) {
      updateExpression = `${updateExpression}, topExceptionsReport.events = list_append(if_not_exists(topExceptionsReport.events, :empty_list), :event)`
    }

    if (shouldLogForAutomationReport(event)) {
      updateExpression = `${updateExpression}, automationReport.events = list_append(if_not_exists(automationReport.events, :empty_list), :event)`
    }

    if (status) {
      expressionAttributeNames["#status"] = "status"
      updateExpressionValues[":status"] = status
      updateExpression += ",#status = :status"
    }

    if (event.eventType === EventType.ErrorRecordArchival) {
      expressionAttributeNames["#errorRecordArchivalDate"] = "errorRecordArchivalDate"
      updateExpressionValues[":errorRecordArchivalDate"] = event.timestamp
      updateExpression += ",#errorRecordArchivalDate = :errorRecordArchivalDate"
    } else if (event.eventType === EventType.SanitisedMessage) {
      expressionAttributeNames["#isSanitised"] = "isSanitised"
      updateExpressionValues[":isSanitised"] = 1
      updateExpression += ",#isSanitised = :isSanitised"
    } else if (event.eventType === "Retrying failed message") {
      updateExpression = `${updateExpression}, retryCount = if_not_exists(retryCounter, :zero) + :one`
      updateExpressionValues[":zero"] = 0
      updateExpressionValues[":one"] = 1
    }

    const options: UpdateOptions = {
      keyName: this.tableKey,
      keyValue: messageId,
      updateExpression,
      expressionAttributeNames,
      updateExpressionValues,
      currentVersion: messageVersion
    }

    const result = await this.updateEntry(this.tableName, options)

    if (isError(result)) {
      return result
    }

    return undefined
  }
}
