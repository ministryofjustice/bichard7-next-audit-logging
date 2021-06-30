import AuditLogEvent from "src/AuditLogEvent"
import getMessageStatus from "./getMessageStatus"
import { AuditLogStatus, isError, PromiseResult } from "../types"
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

  async fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
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
      return null
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

  async addEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    const { status, errorMessage } = getMessageStatus(event)

    const params = {
      keyName: this.tableKey,
      keyValue: messageId,
      updateExpression:
        "set events = list_append(if_not_exists(events, :empty_list), :event)," +
        "#status = :status," +
        "#error = :error",
      expressionAttributeNames: {
        "#status": "status",
        "#error": "error"
      },
      updateExpressionValues: {
        ":event": [event],
        ":empty_list": <AuditLogEvent[]>[],
        ":status": status,
        ":error": errorMessage || ""
      }
    }

    const result = await this.updateEntry(this.tableName, params)

    if (isError(result)) {
      return result
    }

    return undefined
  }
}
