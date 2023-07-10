/* eslint-disable no-prototype-builtins */
import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import type { KeyValuePair, PromiseResult, Result } from "src/shared/types"
import { isError } from "src/shared/types"
import type DynamoGateway from "./DynamoGateway"
import type { Projection } from "./DynamoGateway"
import type FetchByIndexOptions from "./FetchByIndexOptions"
import type KeyComparison from "./KeyComparison"
import type Pagination from "./Pagination"

export default class IndexSearcher<TResult> {
  constructor(
    private gateway: DynamoGateway,
    private tableName: string,
    private partitionKey: string
  ) {}

  private indexName: string

  private hashKey: string

  private hashKeyValue: unknown

  private rangeKey?: string

  private rangeKeyValue?: unknown

  private betweenKeyStart?: unknown

  private betweenKeyEnd?: unknown

  private rangeKeyComparison?: KeyComparison

  private filterKeyName?: string

  private filterKeyValue?: unknown

  private filterKeyComparison?: KeyComparison

  private limit? = 10

  private lastItemForPagination?: KeyValuePair<string, unknown>

  private projection?: Projection

  private isAscendingOrder: boolean

  private validateLastItemForPagination(): Result<void> {
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

  private createLastItemKey(): Result<DocumentClient.Key | undefined> {
    if (!this.lastItemForPagination) {
      return undefined
    }

    const validationResult = this.validateLastItemForPagination()

    if (isError(validationResult)) {
      return validationResult
    }

    const lastItemKey = {
      [this.partitionKey]: this.lastItemForPagination[this.partitionKey],
      [this.hashKey]: this.lastItemForPagination[this.hashKey]
    }

    if (this.rangeKey) {
      lastItemKey[this.rangeKey] = this.lastItemForPagination[this.rangeKey]
    }

    return lastItemKey
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

  setRangeKey(rangeKeyValue: unknown, rangeKeyComparison: KeyComparison): IndexSearcher<TResult> {
    this.rangeKeyValue = rangeKeyValue
    this.rangeKeyComparison = rangeKeyComparison
    return this
  }

  setBetweenKey(start: unknown, end: unknown): IndexSearcher<TResult> {
    this.betweenKeyStart = start
    this.betweenKeyEnd = end
    return this
  }

  paginate(
    limit?: number,
    lastItemForPagination?: unknown | KeyValuePair<string, unknown>,
    isAscendingOrder = false
  ): IndexSearcher<TResult> {
    this.limit = limit
    this.lastItemForPagination = lastItemForPagination as KeyValuePair<string, unknown>
    this.isAscendingOrder = isAscendingOrder
    return this
  }

  setFilter(keyName: string, keyValue: unknown, comparison: KeyComparison): IndexSearcher<TResult> {
    this.filterKeyName = keyName
    this.filterKeyValue = keyValue
    this.filterKeyComparison = comparison
    return this
  }

  setProjection(projection: Projection): IndexSearcher<TResult> {
    this.projection = projection
    return this
  }

  async execute(): PromiseResult<TResult | undefined> {
    const pagination: Pagination = {
      limit: this.limit
    }

    const lastItemKey = this.createLastItemKey()

    if (isError(lastItemKey)) {
      return lastItemKey
    }

    pagination.lastItemKey = lastItemKey

    const options: FetchByIndexOptions = {
      indexName: this.indexName,
      hashKeyName: this.hashKey,
      hashKeyValue: this.hashKeyValue,
      rangeKeyName: this.rangeKey,
      rangeKeyValue: this.rangeKeyValue,
      betweenKeyStart: this.betweenKeyStart,
      betweenKeyEnd: this.betweenKeyEnd,
      rangeKeyComparison: this.rangeKeyComparison,
      filterKeyName: this.filterKeyName,
      filterKeyValue: this.filterKeyValue,
      filterKeyComparison: this.filterKeyComparison,
      isAscendingOrder: this.isAscendingOrder,
      pagination,
      projection: this.projection
    }

    const fetchResult = await this.gateway.fetchByIndex(this.tableName, options)

    if (isError(fetchResult)) {
      return fetchResult
    }

    return <TResult | undefined>fetchResult.Items
  }
}
