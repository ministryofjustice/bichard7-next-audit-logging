import { DynamoGateway } from "../DynamoGateway"
import type { DynamoDbConfig, FetchByIndexOptions, UpdateOptions } from "../DynamoGateway"
import type { AuditLog, AuditLogEvent, PromiseResult } from "../types"
import { isError } from "../types"
import getMessageStatus from "./getMessageStatus"

export default class AuditLogDynamoGateway extends DynamoGateway {
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

  async fetchMany(limit = 10): PromiseResult<AuditLog[]> {
    const result = await this.getMany(this.tableName, this.sortKey, limit)

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result.Items
  }

  async fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
    const options: FetchByIndexOptions = {
      indexName: "externalCorrelationIdIndex",
      attributeName: "externalCorrelationId",
      attributeValue: externalCorrelationId
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

  async fetchByStatus(status: string): PromiseResult<AuditLog[]> {
    const options: FetchByIndexOptions = {
      indexName: "statusIndex",
      attributeName: "status",
      attributeValue: status,
      isAscendingOrder: false
    }

    const result = await this.fetchByIndex(this.tableName, options)

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result?.Items
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

    const sortedEvents = result.events.sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? -1 : 1))

    return sortedEvents
  }

  async addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void> {
    const status = getMessageStatus(event)

    const options: UpdateOptions = {
      keyName: this.tableKey,
      keyValue: messageId,
      updateExpression: `
        set events = list_append(if_not_exists(events, :empty_list), :event),
        #status = :status,
        #lastEventType = :lastEventType
      `,
      expressionAttributeNames: {
        "#status": "status",
        "#lastEventType": "lastEventType"
      },
      updateExpressionValues: {
        ":event": [event],
        ":empty_list": <AuditLogEvent[]>[],
        ":status": status,
        ":lastEventType": event.eventType
      },
      currentVersion: messageVersion
    }

    const result = await this.updateEntry(this.tableName, options)

    if (isError(result)) {
      return result
    }

    return undefined
  }
}
