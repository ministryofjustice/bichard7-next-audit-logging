import type { AuditLogLookupDynamoGateway, AuditLogLookup, DynamoDbConfig, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import { DynamoGateway } from "../DynamoGateway"

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
}