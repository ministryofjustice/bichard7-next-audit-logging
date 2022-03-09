import { DynamoGateway, IndexSearcher } from "../DynamoGateway"
import type { FetchByIndexOptions, UpdateOptions } from "../DynamoGateway"
import type { AuditLog, AuditLogEvent, KeyValuePair, PromiseResult, DynamoDbConfig } from "shared-types"
import { isError } from "shared-types"
import getMessageStatus from "./getMessageStatus"
import type { AuditLogDynamoGateway } from "shared-types"
import shouldLogForTopExceptionsReport from "./shouldLogForTopExceptionsReport"
import shouldLogForAutomationReport from "./shouldLogForAutomationReport"
import getForceOwnerForAutomationReport from "./getForceOwnerForAutomationReport"

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
      attributeName: "externalCorrelationId",
      attributeValue: externalCorrelationId,
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
      attributeName: "messageHash",
      attributeValue: hash,
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
    const status = getMessageStatus(event)

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

    if (event.eventType === "Retrying failed message") {
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
