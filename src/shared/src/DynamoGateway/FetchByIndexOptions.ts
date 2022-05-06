import type Pagination from "./Pagination"
import type RangeKeyComparison from "./RangeKeyComparison"

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
