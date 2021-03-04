import { PromiseResult } from "@handlers/common"
import { DynamoDB } from "aws-sdk"
import { DynamoDbConfig } from "src/types"

export default class DynamoGateway {
  private client: DynamoDB.DocumentClient

  constructor(config: DynamoDbConfig) {
    this.client = new DynamoDB.DocumentClient({
      endpoint: config.DYNAMO_URL,
      region: config.DYNAMO_REGION
    })
  }

  async insertOne<T>(tableName: string, record: T): PromiseResult<void> {
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: record
    }

    return this.client
      .put(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }
}
