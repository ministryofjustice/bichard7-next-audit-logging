import type DynamoDB from "aws-sdk/clients/dynamodb"

export default interface Pagination {
  limit: number
  lastItemKey?: DynamoDB.DocumentClient.Key
}
