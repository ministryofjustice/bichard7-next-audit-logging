import { addDays } from "date-fns"
import { compress, decompress } from "src/shared"
import type { AuditLogLookup, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import { DynamoGateway, IndexSearcher } from "../DynamoGateway"
import type DynamoDbConfig from "../DynamoGateway/DynamoDbConfig"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"

export default class AwsAuditLogLookupDynamoGateway extends DynamoGateway {
  private readonly tableKey: string = "id"

  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  private async decompressItemValue(item: AuditLogLookup): Promise<AuditLogLookup> {
    if (!item.isCompressed) {
      return item
    }

    return { ...item, value: await decompress(item.value) } as AuditLogLookup
  }

  async create(lookupItem: AuditLogLookup): PromiseResult<AuditLogLookup> {
    if (process.env.IS_E2E) {
      lookupItem.expiryTime = Math.round(
        addDays(new Date(), parseInt(process.env.EXPIRY_DAYS || "7")).getTime() / 1000
      ).toString()
    }

    const itemToSave = { ...lookupItem, value: await compress(lookupItem.value), isCompressed: true }

    const result = await this.insertOne(this.tableName, itemToSave, this.tableKey)

    if (isError(result)) {
      return result
    }

    return lookupItem
  }

  async prepare(lookupItem: AuditLogLookup): Promise<DynamoUpdate> {
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

  async fetchById(id: string): PromiseResult<AuditLogLookup> {
    const result = await this.getOne(this.tableName, this.tableKey, id)

    if (isError(result)) {
      return result
    }

    const item = result?.Item as AuditLogLookup

    return item ? this.decompressItemValue(item) : item
  }

  async fetchByMessageId(
    messageId: string,
    lastLookupItem?: AuditLogLookup,
    limit = 10
  ): PromiseResult<AuditLogLookup[]> {
    const result = await new IndexSearcher<AuditLogLookup[]>(this, this.tableName, this.tableKey)
      .useIndex("messageIdIndex")
      .setIndexKeys("messageId", messageId)
      .paginate(limit, lastLookupItem, true)
      .execute()

    if (isError(result)) {
      return result
    }

    return Promise.all((result ?? []).map(this.decompressItemValue))
  }

  async fetchAllByMessageId(messageId: string): PromiseResult<AuditLogLookup[]> {
    let result: AuditLogLookup[] = []
    while (true) {
      const fetchResult = await this.fetchByMessageId(messageId, result.slice(-1)[0])

      if (isError(fetchResult)) {
        return fetchResult
      }

      if (fetchResult.length === 0) {
        break
      }

      result = result.concat(fetchResult)
    }

    return result
  }

  async deleteByMessageId(messageId: string): PromiseResult<void> {
    const lookupItems = await this.fetchAllByMessageId(messageId)

    if (isError(lookupItems)) {
      return lookupItems
    }

    const lookupIds = lookupItems.map((lookupItem) => lookupItem.id)
    return this.deleteMany(this.tableName, this.tableKey, lookupIds)
  }
}
