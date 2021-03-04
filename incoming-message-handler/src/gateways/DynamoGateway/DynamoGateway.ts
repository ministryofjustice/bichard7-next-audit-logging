import { PromiseResult } from "@handlers/common"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { DynamoDbConfig } from "src/types"

export default class DynamoGateway {
  private readonly documentClient: DocumentClient

  constructor(config: DynamoDbConfig) {
    this.documentClient = new DocumentClient({
      endpoint: config.DYNAMO_URL,
      region: config.DYNAMO_REGION
    })
  }

  protected get client(): DocumentClient {
    return this.documentClient
  }

  async insertOne<T>(tableName: string, record: T): PromiseResult<void> {
    const params: DocumentClient.PutItemInput = {
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
