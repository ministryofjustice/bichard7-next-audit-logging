import type Pagination from "./Pagination"

export enum RangeKeyComparison {
  LessThanOrEqual
}

export default interface FetchByIndexOptions {
  indexName: string
  hashKeyName: string
  hashKeyValue: unknown
  rangeKeyName?: string
  rangeKeyValue?: unknown
  rangeKeyComparison?: RangeKeyComparison
  isAscendingOrder?: boolean
  pagination: Pagination
}
