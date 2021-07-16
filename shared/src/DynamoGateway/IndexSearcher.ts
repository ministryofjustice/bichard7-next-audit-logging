/* eslint-disable no-prototype-builtins */
import type { KeyValuePair, PromiseResult, Result } from "../types"
import { isError } from "../types"
import type DynamoGateway from "./DynamoGateway"
import type FetchByIndexOptions from "./FetchByIndexOptions"
import type Pagination from "./Pagination"

export default class IndexSearcher<TResult> {
  constructor(private gateway: DynamoGateway, private tableName: string, private partitionKey: string) {}

  private indexName: string

  private hashKey: string

  private hashKeyValue: unknown

  private rangeKey?: string

  private limit = 10

  private lastItemForPagination?: KeyValuePair<string, unknown>

  private isAscendingOrder: boolean

  private validateLastItemForPagination(): Result<undefined> {
    if (!this.lastItemForPagination) {
      return undefined
    }

    if (!this.lastItemForPagination.hasOwnProperty(this.partitionKey)) {
      return new Error(`lastItemForPagination does not contain '${this.partitionKey}' field`)
    }

    if (!this.lastItemForPagination.hasOwnProperty(this.hashKey)) {
      return new Error(`lastItemForPagination does not contain '${this.hashKey}' field`)
    }

    if (this.rangeKey && !this.lastItemForPagination.hasOwnProperty(this.rangeKey)) {
      return new Error(`lastItemForPagination does not contain '${this.rangeKey}' field`)
    }

    return undefined
  }

  useIndex(indexName: string): IndexSearcher<TResult> {
    this.indexName = indexName
    return this
  }

  setIndexKeys(hashKey: string, hashKeyValue: unknown, rangeKey?: string): IndexSearcher<TResult> {
    this.hashKey = hashKey
    this.hashKeyValue = hashKeyValue
    this.rangeKey = rangeKey
    return this
  }

  paginate(
    limit: number,
    lastItemForPagination?: unknown | KeyValuePair<string, unknown>,
    isAscendingOrder = false
  ): IndexSearcher<TResult> {
    this.limit = limit
    this.lastItemForPagination = lastItemForPagination as KeyValuePair<string, unknown>
    this.isAscendingOrder = isAscendingOrder
    return this
  }

  async execute(): PromiseResult<TResult | undefined> {
    const pagination: Pagination = {
      limit: this.limit
    }

    if (this.lastItemForPagination) {
      const validationResult = this.validateLastItemForPagination()

      if (isError(validationResult)) {
        return validationResult
      }

      pagination.lastItemKey = {
        [this.partitionKey]: this.lastItemForPagination[this.partitionKey],
        [this.hashKey]: this.lastItemForPagination[this.hashKey]
      }

      if (this.rangeKey) {
        pagination.lastItemKey[this.rangeKey] = this.lastItemForPagination[this.rangeKey]
      }
    }

    const options: FetchByIndexOptions = {
      indexName: this.indexName,
      attributeName: this.hashKey,
      attributeValue: this.hashKeyValue,
      isAscendingOrder: this.isAscendingOrder,
      pagination
    }

    const fetchResult = await this.gateway.fetchByIndex(this.tableName, options)

    if (isError(fetchResult)) {
      return fetchResult
    }

    return <TResult | undefined>fetchResult.Items
  }
}
