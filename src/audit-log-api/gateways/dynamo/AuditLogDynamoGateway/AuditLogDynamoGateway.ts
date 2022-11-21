import { addDays } from "date-fns"
import { compress, decompress } from "src/shared"
import type { DynamoAuditLog, DynamoAuditLogEvent, KeyValuePair, PromiseResult } from "src/shared/types"
import { ApiAuditLogEvent, isError } from "src/shared/types"
import { v4 as uuid } from "uuid"
import type {
  EventsFilterOptions,
  FetchByStatusOptions,
  FetchManyOptions,
  FetchRangeOptions,
  FetchUnsanitisedOptions,
  ProjectionOptions
} from "../../../types/queryParams"
import type { FetchByIndexOptions, UpdateOptions } from "../DynamoGateway"
import { DynamoGateway, IndexSearcher, KeyComparison } from "../DynamoGateway"
import type DynamoDbConfig from "../DynamoGateway/DynamoDbConfig"
import type { Projection } from "../DynamoGateway/DynamoGateway"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"
import type AuditLogDynamoGatewayInterface from "./AuditLogDynamoGatewayInterface"

const maxAttributeValueLength = 1000

type InternalDynamoAuditLog = Omit<DynamoAuditLog, "events">
type InternalDynamoAuditLogEvent = DynamoAuditLogEvent & { _id: string }

const convertDynamoAuditLogToInternal = (
  input: InternalDynamoAuditLog & { events?: ApiAuditLogEvent[] }
): InternalDynamoAuditLog => {
  delete input.events
  return input
}

export default class AuditLogDynamoGateway extends DynamoGateway implements AuditLogDynamoGatewayInterface {
  readonly auditLogTableKey: string = "messageId"

  readonly auditLogSortKey: string = "receivedDate"

  readonly eventsTableKey: string = "_id"

  constructor(private readonly config: DynamoDbConfig) {
    super(config)
  }

  getProjectionExpression(includeColumns: string[] = [], excludeColumns: string[] = []): Projection {
    const defaultProjection = [
      "caseId",
      "events",
      "externalCorrelationId",
      "externalId",
      "forceOwner",
      "lastEventType",
      "messageId",
      "receivedDate",
      "s3Path",
      "#status",
      "pncStatus",
      "triggerStatus",
      "systemId",
      "#dummyKey"
    ]

    const excludedProjection = defaultProjection.filter((column) => !excludeColumns.includes(column))
    const fullProjection = new Set(excludedProjection.concat(includeColumns))

    return {
      expression: Array.from(fullProjection).join(","),
      attributeNames: { "#status": "status", "#dummyKey": "_" }
    }
  }

  async create(message: DynamoAuditLog): PromiseResult<DynamoAuditLog> {
    if (process.env.IS_E2E) {
      message.expiryTime = Math.round(
        addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
      ).toString()
    }
    const messageToCreate = convertDynamoAuditLogToInternal(message)

    const result = await this.insertOne<InternalDynamoAuditLog>(
      this.config.auditLogTableName,
      messageToCreate,
      this.auditLogTableKey
    )

    if (isError(result)) {
      return result
    }

    return message
  }

  async createMany(messages: DynamoAuditLog[]): PromiseResult<DynamoAuditLog[]> {
    if (process.env.IS_E2E) {
      messages.map((message) => {
        message.expiryTime = Math.round(
          addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
        ).toString()
      })
    }

    const result = await this.insertMany(this.config.auditLogTableName, messages, "messageId")

    if (isError(result)) {
      return result
    }

    return messages
  }

  async updateSanitiseCheck(message: DynamoAuditLog, nextSanitiseCheck: Date): PromiseResult<void> {
    const options: UpdateOptions = {
      keyName: this.auditLogTableKey,
      keyValue: message.messageId,
      updateExpression: "SET nextSanitiseCheck = :value",
      updateExpressionValues: { ":value": nextSanitiseCheck.toISOString() },
      currentVersion: message.version
    }
    const result = await this.updateEntry(this.config.auditLogTableName, options)
    if (isError(result)) {
      return result
    }
  }

  private async mergeEventsFromEventsTable(
    auditLogs: DynamoAuditLog[],
    options: EventsFilterOptions = {}
  ): PromiseResult<void> {
    for (const auditLog of auditLogs) {
      const indexSearcher = new IndexSearcher<ApiAuditLogEvent[]>(
        this,
        this.config.eventsTableName,
        this.eventsTableKey
      ).setProjection({
        expression:
          "attributes,category,eventSource,eventSourceQueueName,eventType,eventXml,#timestamp,eventCode,#user",
        attributeNames: { "#timestamp": "timestamp", "#user": "user" }
      })

      if (options.eventsFilter) {
        indexSearcher
          .useIndex(`${options.eventsFilter}Index`)
          .setIndexKeys("_messageId", auditLog.messageId, `_${options.eventsFilter}`)
          .setRangeKey(1, KeyComparison.Equals)
      } else {
        indexSearcher.useIndex("messageIdIndex").setIndexKeys("_messageId", auditLog.messageId, "timestamp")
      }

      const events = (await indexSearcher.execute()) ?? []

      if (isError(events)) {
        return events
      }

      for (let i = 0; i < events.length; i++) {
        const decompressedEvent = await this.decompressEventValues(events[i])
        if (isError(decompressedEvent)) {
          return decompressedEvent
        }

        events[i] = decompressedEvent
      }

      auditLog.events = (auditLog.events ?? [])
        .concat(events ?? [])
        .sort((a, b) => (a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0))
    }
  }

  async fetchMany(options: FetchManyOptions = {}): PromiseResult<DynamoAuditLog[]> {
    const result = await new IndexSearcher<DynamoAuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex(`${this.auditLogSortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .setProjection(this.getProjectionExpression(options.includeColumns, options.excludeColumns))
      .paginate(options.limit, options.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.mergeEventsFromEventsTable(result as DynamoAuditLog[])
    }

    return result as DynamoAuditLog[]
  }

  async fetchRange(options: FetchRangeOptions): PromiseResult<DynamoAuditLog[]> {
    const result = await new IndexSearcher<DynamoAuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex(`${this.auditLogSortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .setBetweenKey(options.start.toISOString(), options.end.toISOString())
      .setProjection(this.getProjectionExpression(options.includeColumns, options.excludeColumns))
      .paginate(options.limit, options.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.mergeEventsFromEventsTable(result as DynamoAuditLog[], { eventsFilter: options.eventsFilter })
    }

    return <DynamoAuditLog[]>result
  }

  async fetchByExternalCorrelationId(
    externalCorrelationId: string,
    options: ProjectionOptions = {}
  ): PromiseResult<DynamoAuditLog | null> {
    const fetchByIndexOptions: FetchByIndexOptions = {
      indexName: "externalCorrelationIdIndex",
      hashKeyName: "externalCorrelationId",
      hashKeyValue: externalCorrelationId,
      pagination: { limit: 1 },
      projection: this.getProjectionExpression(options?.includeColumns, options?.excludeColumns)
    }

    const result = await this.fetchByIndex(this.config.auditLogTableName, fetchByIndexOptions)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return null
    }

    const items = <DynamoAuditLog[]>result?.Items
    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.mergeEventsFromEventsTable(items as DynamoAuditLog[])
    }

    return items[0]
  }

  async fetchByHash(hash: string): PromiseResult<DynamoAuditLog | null> {
    const options: FetchByIndexOptions = {
      indexName: "messageHashIndex",
      hashKeyName: "messageHash",
      hashKeyValue: hash,
      pagination: { limit: 1 }
    }

    const result = await this.fetchByIndex(this.config.auditLogTableName, options)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return null
    }

    const items = <DynamoAuditLog[]>result?.Items
    await this.mergeEventsFromEventsTable(items as DynamoAuditLog[])

    return items[0]
  }

  async fetchByStatus(status: string, options: FetchByStatusOptions = {}): PromiseResult<DynamoAuditLog[]> {
    const result = await new IndexSearcher<DynamoAuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex("statusIndex")
      .setIndexKeys("status", status, "receivedDate")
      .setProjection(this.getProjectionExpression(options?.includeColumns, options?.excludeColumns))
      .paginate(options?.limit, options?.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.mergeEventsFromEventsTable(result as DynamoAuditLog[])
    }

    return <DynamoAuditLog[]>result
  }

  async fetchUnsanitised(options: FetchUnsanitisedOptions = {}): PromiseResult<DynamoAuditLog[]> {
    const result = await new IndexSearcher<DynamoAuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex("isSanitisedIndex")
      .setIndexKeys("isSanitised", 0, "nextSanitiseCheck")
      .setRangeKey(new Date().toISOString(), KeyComparison.LessThanOrEqual)
      .setProjection(this.getProjectionExpression(options?.includeColumns, options?.excludeColumns))
      .paginate(options?.limit, options?.lastMessage, true)
      .execute()

    if (isError(result)) {
      return result
    }

    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.mergeEventsFromEventsTable(result as DynamoAuditLog[])
    }

    return <DynamoAuditLog[]>result
  }

  async fetchOne(messageId: string, options: ProjectionOptions = {}): PromiseResult<DynamoAuditLog | undefined> {
    const result = await this.getOne(
      this.config.auditLogTableName,
      this.auditLogTableKey,
      messageId,
      this.getProjectionExpression(options?.includeColumns, options?.excludeColumns)
    )

    if (isError(result)) {
      return result
    }

    const item = result?.Item as DynamoAuditLog
    if (item && (!options.excludeColumns || !options.excludeColumns.includes("events"))) {
      await this.mergeEventsFromEventsTable([item])
    }

    return item
  }

  async fetchVersion(messageId: string): PromiseResult<number | null> {
    const result = await this.getRecordVersion(this.config.auditLogTableName, this.auditLogTableKey, messageId)

    if (isError(result)) {
      return result
    }

    const auditLog = result?.Item as DynamoAuditLog

    return auditLog ? auditLog.version : null
  }

  async fetchEvents(messageId: string): PromiseResult<DynamoAuditLogEvent[]> {
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

    return result.events as DynamoAuditLogEvent[]
  }

  async update(existing: DynamoAuditLog, updates: Partial<DynamoAuditLog>): PromiseResult<void> {
    const updateExpression = []
    const expressionAttributeNames: KeyValuePair<string, string> = {}
    const updateExpressionValues: KeyValuePair<string, unknown> = {}

    const dynamoUpdates: DynamoUpdate[] = []

    if (updates.events) {
      const events = await this.prepareStoreEvents(existing.messageId, updates.events)
      if (isError(events)) {
        return events
      }

      dynamoUpdates.push(...events)
    }

    if (updates.forceOwner) {
      updateExpressionValues[":forceOwner"] = updates.forceOwner
      updateExpression.push("forceOwner = :forceOwner")
    }

    if (updates.status) {
      expressionAttributeNames["#status"] = "status"
      updateExpressionValues[":status"] = updates.status
      updateExpression.push("#status = :status")
    }

    if (updates.pncStatus) {
      updateExpressionValues[":pncStatus"] = updates.pncStatus
      updateExpression.push("pncStatus = :pncStatus")
    }

    if (updates.triggerStatus) {
      updateExpressionValues[":triggerStatus"] = updates.triggerStatus
      updateExpression.push("triggerStatus = :triggerStatus")
    }

    if (updates.errorRecordArchivalDate) {
      updateExpression.push("errorRecordArchivalDate = :errorRecordArchivalDate")
      updateExpressionValues[":errorRecordArchivalDate"] = updates.errorRecordArchivalDate
    }

    if (updates.isSanitised) {
      updateExpression.push("isSanitised = :isSanitised")
      updateExpressionValues[":isSanitised"] = updates.isSanitised
    }

    if (updates.retryCount) {
      updateExpression.push("retryCount = :retryCount")
      updateExpressionValues[":retryCount"] = updates.retryCount
    }

    if (updateExpression.length > 0) {
      dynamoUpdates.push({
        Update: {
          TableName: this.config.auditLogTableName,
          Key: {
            messageId: existing.messageId
          },
          UpdateExpression: `SET ${updateExpression.join(",")} ADD version :version_increment`,
          ...(Object.keys(expressionAttributeNames).length > 0
            ? { ExpressionAttributeNames: expressionAttributeNames }
            : {}),
          ExpressionAttributeValues: {
            ...updateExpressionValues,
            ":version": existing.version,
            ":version_increment": 1
          },
          ConditionExpression: `attribute_exists(${this.auditLogTableKey}) AND version = :version`
        }
      })
    }

    if (dynamoUpdates.length === 0) {
      return Promise.resolve()
    }

    return this.executeTransaction(dynamoUpdates)
  }

  replaceAuditLog(auditLog: DynamoAuditLog, version: number): PromiseResult<void> {
    const replacement = { ...auditLog, version: version + 1 }
    return this.replaceOne(this.config.auditLogTableName, replacement, this.auditLogTableKey, version)
  }

  private async prepareStoreEvents(messageId: string, events: DynamoAuditLogEvent[]): PromiseResult<DynamoUpdate[]> {
    const dynamoUpdates: DynamoUpdate[] = []
    for (const event of events) {
      const compressedEvent = await this.compressEventValues(event)
      if (isError(compressedEvent)) {
        return compressedEvent
      }

      const eventToInsert: InternalDynamoAuditLogEvent = { ...compressedEvent, _id: uuid(), _messageId: messageId }
      dynamoUpdates.push({
        Put: {
          Item: { ...eventToInsert, _: "_" },
          TableName: this.config.eventsTableName,
          ExpressionAttributeNames: { "#id": this.eventsTableKey },
          ConditionExpression: `attribute_not_exists(#id)`
        }
      })
    }

    return dynamoUpdates
  }

  private async compressEventValues(event: DynamoAuditLogEvent): PromiseResult<DynamoAuditLogEvent> {
    for (const attributeKey of Object.keys(event.attributes)) {
      const attributeValue = event.attributes[attributeKey]
      if (attributeValue && typeof attributeValue === "string" && attributeValue.length > maxAttributeValueLength) {
        const compressedValue = await compress(attributeValue)
        if (isError(compressedValue)) {
          return compressedValue
        }

        event.attributes[attributeKey] = { _compressedValue: compressedValue }
      }
    }

    if (event.eventXml && typeof event.eventXml === "string" && event.eventXml.length > maxAttributeValueLength) {
      const compressedValue = await compress(event.eventXml)
      if (isError(compressedValue)) {
        return compressedValue
      }

      event.eventXml = { _compressedValue: compressedValue }
    }

    return event
  }

  private async decompressEventValues(event: ApiAuditLogEvent): PromiseResult<ApiAuditLogEvent> {
    for (const [attributeKey, attributeValue] of Object.entries(event.attributes)) {
      if (attributeValue && typeof attributeValue === "object" && "_compressedValue" in attributeValue) {
        const compressedValue = (attributeValue as { _compressedValue: string })._compressedValue
        const decompressedValue = await decompress(compressedValue)
        if (isError(decompressedValue)) {
          return decompressedValue
        }

        event.attributes[attributeKey] = decompressedValue
      }
    }

    if (event.eventXml && typeof event.eventXml === "object" && "_compressedValue" in event.eventXml) {
      const decompressedValue = await decompress(event.eventXml._compressedValue)
      if (isError(decompressedValue)) {
        return decompressedValue
      }

      event.eventXml = decompressedValue
    }

    return event
  }
}
