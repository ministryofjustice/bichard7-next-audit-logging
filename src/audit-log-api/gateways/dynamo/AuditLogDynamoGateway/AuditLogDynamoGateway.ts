import { addDays } from "date-fns"
import { compress } from "src/shared"
import type { AuditLog, BichardAuditLogEvent, KeyValuePair, PromiseResult, ValueLookup } from "src/shared/types"
import { AuditLogEvent, AuditLogLookup, isError } from "src/shared/types"
import type {
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

  async create(message: AuditLog): PromiseResult<AuditLog> {
    if (process.env.IS_E2E) {
      message.expiryTime = Math.round(
        addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
      ).toString()
    }

    const result = await this.insertOne(this.config.auditLogTableName, message, this.auditLogTableKey)

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

    const result = await this.insertMany(this.config.auditLogTableName, messages, "messageId")

    if (isError(result)) {
      return result
    }

    return messages
  }

  async updateSanitiseCheck(message: AuditLog, nextSanitiseCheck: Date): PromiseResult<void> {
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

  private async addEvents(auditLogs: AuditLog[]): PromiseResult<void> {
    for (const auditLog of auditLogs) {
      const events = await new IndexSearcher<AuditLogEvent[]>(this, this.config.eventsTableName, this.eventsTableKey)
        .useIndex("messageIdIndex")
        .setIndexKeys("_messageId", auditLog.messageId, "timestamp")
        .execute()

      if (isError(events)) {
        return events
      }

      auditLog.events = auditLog.events.concat(events ?? [])
    }
  }

  async fetchMany(options: FetchManyOptions = {}): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex(`${this.auditLogSortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .setProjection(this.getProjectionExpression(options.includeColumns, options.excludeColumns))
      .paginate(options.limit, options.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      await this.addEvents(result as AuditLog[])
    }

    return result as AuditLog[]
  }

  async fetchRange(options: FetchRangeOptions): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
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
      await this.addEvents(result as AuditLog[])
    }

    return <AuditLog[]>result
  }

  async fetchByExternalCorrelationId(
    externalCorrelationId: string,
    options?: ProjectionOptions
  ): PromiseResult<AuditLog | null> {
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

    const result = await this.fetchByIndex(this.config.auditLogTableName, options)

    if (isError(result)) {
      return result
    }

    if (result.Count === 0) {
      return null
    }

    const items = <AuditLog[]>result?.Items
    return items[0]
  }

  async fetchByStatus(status: string, options?: FetchByStatusOptions): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex("statusIndex")
      .setIndexKeys("status", status, "receivedDate")
      .setProjection(this.getProjectionExpression(options?.includeColumns, options?.excludeColumns))
      .paginate(options?.limit, options?.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchUnsanitised(options?: FetchUnsanitisedOptions): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.config.auditLogTableName, this.auditLogTableKey)
      .useIndex("isSanitisedIndex")
      .setIndexKeys("isSanitised", 0, "nextSanitiseCheck")
      .setRangeKey(new Date().toISOString(), KeyComparison.LessThanOrEqual)
      .setProjection(this.getProjectionExpression(options?.includeColumns, options?.excludeColumns))
      .paginate(options?.limit, options?.lastMessage, true)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchOne(messageId: string, options?: ProjectionOptions): PromiseResult<AuditLog | undefined> {
    const result = await this.getOne(
      this.config.auditLogTableName,
      this.auditLogTableKey,
      messageId,
      this.getProjectionExpression(options?.includeColumns, options?.excludeColumns)
    )

    if (isError(result)) {
      return result
    }

    return result?.Item as AuditLog
  }

  async fetchVersion(messageId: string): PromiseResult<number | null> {
    const result = await this.getRecordVersion(this.config.auditLogTableName, this.auditLogTableKey, messageId)

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

  update(existing: AuditLog, updates: Partial<AuditLog>): PromiseResult<void> {
    const updateExpression = []
    const expressionAttributeNames: KeyValuePair<string, string> = {}
    const updateExpressionValues: KeyValuePair<string, unknown> = {}

    const dynamoUpdates: DynamoUpdate[] = []

    if (updates.events) {
      dynamoUpdates.push(...this.prepareStoreEvents(existing.messageId, updates.events))
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

  async prepareLookupItems(event: AuditLogEvent, messageId: string): Promise<[DynamoUpdate[], AuditLogEvent]> {
    const attributes: KeyValuePair<string, unknown> = {}
    const dynamoUpdates: DynamoUpdate[] = []

    const attributeKeys = Object.keys(event.attributes)

    for (const attributeKey of attributeKeys) {
      const attributeValue = event.attributes[attributeKey]
      if (attributeValue && typeof attributeValue === "string" && attributeValue.length > maxAttributeValueLength) {
        const lookupItem = new AuditLogLookup(attributeValue, messageId)
        const lookupDynamoUpdate = await this.prepareLookupItem(lookupItem)

        dynamoUpdates.push(lookupDynamoUpdate)
        attributes[attributeKey] = { valueLookup: lookupItem.id } as ValueLookup
      } else {
        attributes[attributeKey] = attributeValue
      }
    }

    let eventXml: string | undefined | ValueLookup =
      "eventXml" in event ? (event as BichardAuditLogEvent).eventXml : undefined
    if (eventXml) {
      const lookupItem = new AuditLogLookup(eventXml, messageId)
      const lookupDynamoUpdates = await this.prepareLookupItem(lookupItem)

      dynamoUpdates.push(lookupDynamoUpdates)
      eventXml = { valueLookup: lookupItem.id }
    }

    const updatedEvent = {
      ...event,
      attributes,
      ...(eventXml ? { eventXml } : {})
    } as AuditLogEvent
    return [dynamoUpdates, updatedEvent]
  }

  async prepareLookupItem(lookupItem: AuditLogLookup): Promise<DynamoUpdate> {
    if (process.env.IS_E2E) {
      lookupItem.expiryTime = Math.round(
        addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
      ).toString()
    }

    const itemToSave = { ...lookupItem, value: await compress(lookupItem.value), isCompressed: true }

    return {
      Put: {
        Item: itemToSave,
        TableName: this.config.lookupTableName,
        ConditionExpression: `attribute_not_exists(${this.auditLogTableKey})`
      }
    }
  }

  replaceAuditLog(auditLog: AuditLog, version: number): PromiseResult<void> {
    const replacement = { ...auditLog, version: version + 1 }
    return this.replaceOne(this.config.auditLogTableName, replacement, this.auditLogTableKey, version)
  }

  private prepareStoreEvents(messageId: string, events: AuditLogEvent[]): DynamoUpdate[] {
    return events.map((event) => {
      const eventToInsert = new AuditLogEvent({ ...event, _messageId: messageId })

      return {
        Put: {
          Item: { ...eventToInsert, _: "_" },
          TableName: this.config.eventsTableName,
          ExpressionAttributeNames: { "#id": this.eventsTableKey },
          ConditionExpression: `attribute_not_exists(#id)`
        }
      }
    })
  }
}
