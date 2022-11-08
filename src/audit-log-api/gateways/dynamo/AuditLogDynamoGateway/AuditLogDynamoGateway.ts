import { addDays } from "date-fns"
import maxBy from "lodash.maxby"
import { ApplicationError, AuditLog, AuditLogEvent, AuditLogLookup, BichardAuditLogEvent, KeyValuePair, PromiseResult, ValueLookup } from "src/shared/types"
import { EventCode, isError } from "src/shared/types"
import { NotFoundError } from "src/shared/types/ApplicationError"
import { compress } from "src/shared/utils"
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
import CalculateMessageStatusUseCase from "./CalculateMessageStatusUseCase"
import {
  archivalUpdateComponent,
  automationRateReportUpdateComponent,
  forceOwnerUpdateComponent,
  retryCountUpdateComponent,
  sanitisationUpdateComponent,
  statusUpdateComponent,
  topExceptionsReportUpdateComponent
} from "./updateComponents"
import type { UpdateComponent } from "./updateComponents/types"

const maxAttributeValueLength = 1000

export default class AuditLogDynamoGateway extends DynamoGateway implements AuditLogDynamoGatewayInterface {
  private readonly tableKey: string = "messageId"

  private readonly sortKey: string = "receivedDate"

  constructor(config: DynamoDbConfig, private readonly tableName: string) {
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
    const { status, pncStatus, triggerStatus } = new CalculateMessageStatusUseCase(message.events).call()
    message.status = status
    message.pncStatus = pncStatus
    message.triggerStatus = triggerStatus

    message.errorRecordArchivalDate =
      message.errorRecordArchivalDate ??
      message.events.find((event) => event.eventCode === EventCode.ErrorRecordArchived)?.timestamp
    message.isSanitised = message.events.find((event) => event.eventCode === EventCode.Sanitised) ? 1 : 0

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

  async fetchMany(options: FetchManyOptions = {}): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
      .useIndex(`${this.sortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .setProjection(this.getProjectionExpression(options.includeColumns, options.excludeColumns))
      .paginate(options.limit, options.lastMessage)
      .execute()

    if (isError(result)) {
      return result
    }

    return <AuditLog[]>result
  }

  async fetchRange(options: FetchRangeOptions): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
      .useIndex(`${this.sortKey}Index`)
      .setIndexKeys("_", "_", "receivedDate")
      .setBetweenKey(options.start.toISOString(), options.end.toISOString())
      .setProjection(this.getProjectionExpression(options.includeColumns, options.excludeColumns))
      .paginate(options.limit, options.lastMessage)
      .execute()

    if (isError(result)) {
      return result
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

    const result = await this.fetchByIndex(this.tableName, fetchByIndexOptions)

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

  async fetchByStatus(status: string, options?: FetchByStatusOptions): PromiseResult<AuditLog[]> {
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
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
    const result = await new IndexSearcher<AuditLog[]>(this, this.tableName, this.tableKey)
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

  async fetchOne(messageId: string, options?: ProjectionOptions): PromiseResult<AuditLog> {
    const result = await this.getOne(
      this.tableName,
      this.tableKey,
      messageId,
      this.getProjectionExpression(options?.includeColumns, options?.excludeColumns)
    )

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

  async addEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    const messageVersion = await this.fetchVersion(messageId)
    if (isError(messageVersion)) {
      return messageVersion
    }

    if (messageVersion === null) {
      return new NotFoundError()
    }

    const dynamoUpdate = await this.prepare(messageId, messageVersion, event)
    if (isError(dynamoUpdate)) {
      return dynamoUpdate
    }

    const result = await this.executeTransaction(dynamoUpdate)

    if (isError(result)) {
      return result
    }

    return undefined
  }

  async prepare(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<DynamoUpdate[]> {
    const [lookupItemsDynamoUpdate, updatedEvent] = await this.prepareLookupItems(event, messageId)
    const eventsDynamoUpdate = await this.prepareEvents(messageId, messageVersion, [updatedEvent])
    if (isError(eventsDynamoUpdate)) {
      return eventsDynamoUpdate
    }

    return lookupItemsDynamoUpdate.concat(eventsDynamoUpdate)
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
    let expressionAttributeNames: KeyValuePair<string, string> = {
      "#lastEventType": "lastEventType"
    }
    const lastEventType = maxBy(events, (event) => event.timestamp)?.eventType
    let updateExpressionValues: KeyValuePair<string, unknown> = {
      ":events": events,
      ":empty_list": <AuditLogEvent[]>[],
      ":lastEventType": lastEventType
    }

    const updateComponents: UpdateComponent[] = [
      forceOwnerUpdateComponent,
      statusUpdateComponent,
      topExceptionsReportUpdateComponent,
      automationRateReportUpdateComponent,
      archivalUpdateComponent,
      sanitisationUpdateComponent,
      retryCountUpdateComponent
    ]

    for (const updateComponent of updateComponents) {
      const updateComponentResult = updateComponent(currentEvents, events)

      if (updateComponentResult.updateExpression) {
        updateExpression += ", " + updateComponentResult.updateExpression
      }

      if (updateComponentResult.expressionAttributeNames) {
        expressionAttributeNames = { ...expressionAttributeNames, ...updateComponentResult.expressionAttributeNames }
      }

      if (updateComponentResult.updateExpressionValues) {
        updateExpressionValues = { ...updateExpressionValues, ...updateComponentResult.updateExpressionValues }
      }
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
        TableName: this.tableName,
        ConditionExpression: `attribute_not_exists(${this.tableKey})`
      }
    }
  }
}
