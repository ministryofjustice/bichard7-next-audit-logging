import type KeyComparison from "./KeyComparison"
import type Pagination from "./Pagination"

export default interface FetchByIndexOptions {
  indexName: string
  hashKeyName: string
  hashKeyValue: unknown
  rangeKeyName?: string
  rangeKeyValue?: unknown
  betweenKeyStart?: unknown
  betweenKeyEnd?: unknown
  rangeKeyComparison?: KeyComparison
  filterKeyName?: string
  filterKeyValue?: unknown
  filterKeyComparison?: KeyComparison
  isAscendingOrder?: boolean
  pagination: Pagination
}
