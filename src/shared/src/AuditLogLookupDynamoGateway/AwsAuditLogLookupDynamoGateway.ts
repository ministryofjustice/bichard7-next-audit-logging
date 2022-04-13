import type { AuditLogLookupDynamoGateway, AuditLogLookup, DynamoDbConfig, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import { DynamoGateway, IndexSearcher } from "../DynamoGateway"

export default class AwsAuditLogLookupDynamoGateway extends DynamoGateway implements AuditLogLookupDynamoGateway {
  private readonly tableKey: string = "id"

  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  async create(lookupItem: AuditLogLookup): PromiseResult<AuditLogLookup> {
    const result = await this.insertOne(this.tableName, lookupItem, "id")

    if (isError(result)) {
      return result
    }

    return lookupItem
  }

  async fetchById(id: string): PromiseResult<AuditLogLookup> {
    const result = await this.getOne(this.tableName, this.tableKey, id)

    if (isError(result)) {
      return result
    }

    return result?.Item as AuditLogLookup
  }

  async fetchByMessageId(messageId: string, lastLookupItem?: AuditLogLookup): PromiseResult<AuditLogLookup[]> {
    const result = await new IndexSearcher<AuditLogLookup[]>(this, this.tableName, this.tableKey)
      .useIndex("messageIdIndex")
      .setIndexKeys("messageId", messageId)
      .paginate(100, lastLookupItem, true)
      .execute()

    if (isError(result)) {
      return result
    }

    return result ?? []
  }

  async fetchAllByMessageId(messageId: string): PromiseResult<AuditLogLookup[]> {
    let result: AuditLogLookup[] = []
    while (true) {
      const fetchResult = await this.fetchByMessageId(messageId, result.at(-1))

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
