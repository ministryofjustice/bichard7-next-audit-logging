import AuditLogEvent from "src/AuditLogEvent"
import { isError, PromiseResult } from "../types"
import { DynamoGateway, DynamoDbConfig } from "../DynamoGateway"
import AuditLog from "../AuditLog"

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

  async fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog> {
    const options = {
      indexName: "externalCorrelationIdIndex",
      attributeName: "externalCorrelationId",
      attributeValue: externalCorrelationId
    }

    const result = await this.fetchByIndex(this.tableName, options)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return new Error(`Message with external correlation id '${externalCorrelationId}' does not exist.`)
    }

    const items = <AuditLog[]>result?.Items
    return items[0]
  }

  async fetchOne(messageId: string): PromiseResult<AuditLog> {
    const result = await this.getOne(this.tableName, this.tableKey, messageId)

    if (isError(result)) {
      return result
    }

    return result?.Item as AuditLog
  }

  async addEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    const params = {
      keyName: this.tableKey,
      keyValue: messageId,
      updateExpression: "set events = list_append(if_not_exists(events, :empty_list), :event)",
      updateExpressionValues: {
        ":event": [event],
        ":empty_list": <AuditLogEvent[]>[]
      }
    }
    const result = await this.updateEntry(this.tableName, params)

    if (isError(result)) {
      return result
    }

    return undefined
  }
}
