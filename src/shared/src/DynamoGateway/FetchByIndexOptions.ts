import type Pagination from "./Pagination"

export default interface FetchByIndexOptions {
  indexName: string
  attributeName: string
  attributeValue: unknown
  isAscendingOrder?: boolean
  pagination: Pagination
}
