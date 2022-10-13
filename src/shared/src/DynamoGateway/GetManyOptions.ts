import type { Projection } from "./DynamoGateway"
import type Pagination from "./Pagination"

export default interface GetManyOptions {
  sortKey: string
  pagination: Pagination
  projection?: Projection
}
