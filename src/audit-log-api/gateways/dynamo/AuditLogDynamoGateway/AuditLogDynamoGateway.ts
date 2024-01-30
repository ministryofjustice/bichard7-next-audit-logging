import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import { addDays } from "date-fns"
import { compress, decompress } from "src/shared"
import type {
  ApiAuditLogEvent,
  DynamoAuditLog,
  DynamoAuditLogEvent,
  DynamoAuditLogUserEvent,
  KeyValuePair,
  PromiseResult
} from "src/shared/types"
import { isError } from "src/shared/types"
import { v4 as uuid } from "uuid"
import type {
  EventsFilterOptions,
  FetchByStatusOptions,
  FetchManyOptions,
  FetchOneOptions,
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
const getEventsPageLimit = 100
const eventsFetcherParallelism = 20

type InternalDynamoAuditLog = Omit<DynamoAuditLog, "events">
type InternalDynamoAuditLogEvent = DynamoAuditLogEvent & { _id: string }
type InternalDynamoAuditLogUserEvent = DynamoAuditLogUserEvent & { _id: string }

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

  async createManyUserEvents(events: DynamoAuditLogUserEvent[]): PromiseResult<void> {
    const dynamoUpdates = await this.prepareStoreUserEvents(events)

    if (isError(dynamoUpdates)) {
      return dynamoUpdates
    }

    if (dynamoUpdates.length === 0) {
      return Promise.resolve()
    }

    return this.executeTransaction(dynamoUpdates)
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
      const addEventsResult = await this.addEventsFromEventsTable(items)
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return items[0]
  }

  private async addEventsFromEventsTable(
    auditLogs: DynamoAuditLog[],
    options: EventsFilterOptions = {}
  ): PromiseResult<void> {
    const numberOfFetchers = Math.min(auditLogs.length, eventsFetcherParallelism)
    const indexes = [...Array(auditLogs.length).keys()]

    const eventsFetcher = async () => {
      while (indexes.length > 0) {
        const index = indexes.shift()
        if (typeof index !== "number") {
          return
        }

        const result = await this.getEvents(auditLogs[index].messageId, options)
        if (isError(result)) {
          throw result
        }

        auditLogs[index].events = result
      }
    }

    const allResult = await Promise.all([...Array(numberOfFetchers).keys()].map(() => eventsFetcher())).catch(
      (error) => error as Error
    )
    if (isError(allResult)) {
      return allResult
    }
  }

  async fetchByHash(hash: string, options: ProjectionOptions = {}): PromiseResult<DynamoAuditLog[]> {
    const includeColumns = ["messageHash", ...(options?.includeColumns ?? [])]
    const fetchByIndexOptions: FetchByIndexOptions = {
      indexName: "messageHashIndex",
      hashKeyName: "messageHash",
      hashKeyValue: hash,
      pagination: {},
      projection: this.getProjectionExpression(includeColumns, options?.excludeColumns)
    }

    const result = await this.fetchByIndex(this.config.auditLogTableName, fetchByIndexOptions)
    if (isError(result)) {
      return result
    }

    const items = <DynamoAuditLog[]>result?.Items
    if (!options.excludeColumns || !options.excludeColumns.includes("events")) {
      const addEventsResult = await this.addEventsFromEventsTable(items)
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return items
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
      const addEventsResult = await this.addEventsFromEventsTable(result as DynamoAuditLog[])
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return <DynamoAuditLog[]>result
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
      const addEventsResult = await this.addEventsFromEventsTable(result as DynamoAuditLog[])
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return result as DynamoAuditLog[]
  }

  async fetchOne(messageId: string, options: FetchOneOptions = {}): PromiseResult<DynamoAuditLog | undefined> {
    const result = await this.getOne(
      this.config.auditLogTableName,
      this.auditLogTableKey,
      messageId,
      this.getProjectionExpression(options?.includeColumns, options?.excludeColumns),
      options?.stronglyConsistentRead
    )

    if (isError(result)) {
      return result
    }

    const item = result?.Item as DynamoAuditLog
    if (item && (!options.excludeColumns || !options.excludeColumns.includes("events"))) {
      const addEventsResult = await this.addEventsFromEventsTable([item])
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return item
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
      const addEventsResult = await this.addEventsFromEventsTable(result as DynamoAuditLog[], {
        eventsFilter: options.eventsFilter
      })
      if (isError(addEventsResult)) {
        return addEventsResult
      }
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
      const addEventsResult = await this.addEventsFromEventsTable(result as DynamoAuditLog[])
      if (isError(addEventsResult)) {
        return addEventsResult
      }
    }

    return <DynamoAuditLog[]>result
  }

  async fetchVersion(messageId: string): PromiseResult<number | null> {
    const result = await this.getRecordVersion(this.config.auditLogTableName, this.auditLogTableKey, messageId)

    if (isError(result)) {
      return result
    }

    const auditLog = result?.Item as DynamoAuditLog

    return auditLog ? auditLog.version : null
  }

  replaceAuditLog(auditLog: DynamoAuditLog, version: number): PromiseResult<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { events, ...replacement } = { ...auditLog, version: version + 1 }
    return this.replaceOne(this.config.auditLogTableName, replacement, this.auditLogTableKey, version)
  }

  async prepareUpdate(
    existing: DynamoAuditLog,
    updates: Partial<DynamoAuditLog>
  ): PromiseResult<DocumentClient.TransactWriteItem[]> {
    const updateExpression = []
    let removeExpression = ""
    const addExpression: string[] = []
    const conditionExpression: string[] = []
    const expressionAttributeNames: KeyValuePair<string, string> = {}
    const expressionValues: KeyValuePair<string, unknown> = {}

    const dynamoUpdates: DynamoUpdate[] = []

    if (updates.events) {
      const events = await this.prepareStoreEvents(existing.messageId, updates.events)
      if (isError(events)) {
        return events
      }

      dynamoUpdates.push(...events)

      if (typeof existing.eventsCount !== "undefined") {
        addExpression.push("eventsCount :eventsCount_increment")
        conditionExpression.push("eventsCount = :eventsCount")
        expressionValues[":eventsCount_increment"] = events.length
        expressionValues[":eventsCount"] = existing.events?.length ?? 0
      }
    }

    if (updates.forceOwner) {
      expressionValues[":forceOwner"] = updates.forceOwner
      updateExpression.push("forceOwner = :forceOwner")
    }

    if (updates.status) {
      expressionAttributeNames["#status"] = "status"
      expressionValues[":status"] = updates.status
      updateExpression.push("#status = :status")
    }

    if (updates.pncStatus) {
      expressionValues[":pncStatus"] = updates.pncStatus
      updateExpression.push("pncStatus = :pncStatus")
    }

    if (updates.triggerStatus) {
      expressionValues[":triggerStatus"] = updates.triggerStatus
      updateExpression.push("triggerStatus = :triggerStatus")
    }

    if (updates.errorRecordArchivalDate) {
      updateExpression.push("errorRecordArchivalDate = :errorRecordArchivalDate")
      expressionValues[":errorRecordArchivalDate"] = updates.errorRecordArchivalDate
    }

    if (updates.isSanitised) {
      updateExpression.push("isSanitised = :isSanitised")
      expressionValues[":isSanitised"] = updates.isSanitised
    }

    if (updates.nextSanitiseCheck === undefined) {
      removeExpression = "REMOVE nextSanitiseCheck"
    }

    if (updates.retryCount) {
      updateExpression.push("retryCount = :retryCount")
      expressionValues[":retryCount"] = updates.retryCount
    }

    if (updateExpression.length > 0 || addExpression.length > 0) {
      const setExpression = updateExpression.length > 0 ? `SET ${updateExpression.join(",")}` : ""
      addExpression.push("version :version_increment")
      conditionExpression.push(`attribute_exists(${this.auditLogTableKey})`)
      conditionExpression.push("version = :version")

      dynamoUpdates.push({
        Update: {
          TableName: this.config.auditLogTableName,
          Key: {
            messageId: existing.messageId
          },
          UpdateExpression: `${setExpression} ${removeExpression} ADD ${addExpression.join(",")}`,
          ...(Object.keys(expressionAttributeNames).length > 0
            ? { ExpressionAttributeNames: expressionAttributeNames }
            : {}),
          ExpressionAttributeValues: {
            ...expressionValues,
            ":version": existing.version,
            ":version_increment": 1
          },
          ConditionExpression: conditionExpression.join(" AND ")
        }
      })
    }

    return dynamoUpdates
  }

  async update(existing: DynamoAuditLog, updates: Partial<DynamoAuditLog>): PromiseResult<void> {
    const dynamoUpdates = await this.prepareUpdate(existing, updates)
    if (isError(dynamoUpdates)) {
      return dynamoUpdates
    }

    if (dynamoUpdates.length === 0) {
      return Promise.resolve()
    }

    return this.executeTransaction(dynamoUpdates)
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

  private async compressEventValues<TEvent extends DynamoAuditLogEvent | DynamoAuditLogUserEvent>(
    event: TEvent
  ): PromiseResult<TEvent> {
    if (!event.attributes) {
      return event
    }

    for (const attributeKey of Object.keys(event.attributes)) {
      const attributeValue = event.attributes?.[attributeKey]
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

  private async decompressEventValues(event: DynamoAuditLogEvent): PromiseResult<DynamoAuditLogEvent> {
    if (!event.attributes) {
      return event
    }

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

  replaceAuditLogEvents(events: DynamoAuditLogEvent[]): PromiseResult<void> {
    return this.replaceMany(this.config.eventsTableName, events, this.eventsTableKey)
  }

  async getEvents(messageId: string, options: EventsFilterOptions = {}): PromiseResult<DynamoAuditLogEvent[]> {
    let lastMessage: DynamoAuditLogEvent | undefined
    let allEvents: DynamoAuditLogEvent[] = []

    while (true) {
      const indexSearcher = new IndexSearcher<DynamoAuditLogEvent[]>(
        this,
        this.config.eventsTableName,
        this.eventsTableKey
      ).paginate(getEventsPageLimit, lastMessage)

      if (options.eventsFilter) {
        indexSearcher
          .useIndex(`${options.eventsFilter}Index`)
          .setIndexKeys("_messageId", messageId, `_${options.eventsFilter}`)
          .setRangeKey(1, KeyComparison.Equals)
      } else {
        indexSearcher.useIndex("messageIdIndex").setIndexKeys("_messageId", messageId, "timestamp")
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

      allEvents = allEvents.concat(events)

      if (events.length < getEventsPageLimit) {
        return allEvents.sort((a, b) => (a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0))
      }

      lastMessage = events[events.length - 1]
    }
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

  private async prepareStoreUserEvents(events: DynamoAuditLogUserEvent[]): PromiseResult<DynamoUpdate[]> {
    const dynamoUpdates: DynamoUpdate[] = []
    for (const event of events) {
      const compressedEvent = await this.compressEventValues(event)
      if (isError(compressedEvent)) {
        return compressedEvent
      }

      const eventToInsert: InternalDynamoAuditLogUserEvent = { ...compressedEvent, _id: uuid() }
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
}

export { getEventsPageLimit }
