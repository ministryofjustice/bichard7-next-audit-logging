import { DynamoDB } from "aws-sdk"
import { DocumentClient, ExpressionAttributeValueMap, UpdateExpression } from "aws-sdk/clients/dynamodb"
import { PromiseResult } from "../types"
import DynamoDbConfig from "./DynamoDbConfig"

interface UpdateOptions {
  keyName: string
  keyValue: unknown
  updateExpression: UpdateExpression
  updateExpressionValues: ExpressionAttributeValueMap | { [name: string]: unknown }
}

export default class DynamoGateway {
  protected readonly service: DynamoDB

  protected readonly client: DocumentClient

  constructor(config: DynamoDbConfig) {
    this.service = new DynamoDB({
      endpoint: config.DYNAMO_URL,
      region: config.DYNAMO_REGION
    })

    this.client = new DocumentClient({
      service: this.service
    })
  }

  insertOne<T>(tableName: string, record: T, keyName: string): PromiseResult<void> {
    const params: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: record,
      ConditionExpression: `attribute_not_exists(${keyName})`
    }

    return this.client
      .put(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  getMany(tableName: string, limit: number): PromiseResult<DocumentClient.ScanOutput> {
    return this.client
      .scan({
        TableName: tableName,
        Limit: limit
      })
      .promise()
      .catch((error) => <Error>error)
  }

  updateEntry(tableName: string, options: UpdateOptions): PromiseResult<DocumentClient.UpdateItemOutput> {
    const updateParams = <DocumentClient.UpdateItemInput>{
      TableName: tableName,
      Key: {
        [options.keyName]: options.keyValue
      },
      UpdateExpression: options.updateExpression,
      ExpressionAttributeValues: options.updateExpressionValues,
      ConditionExpression: `attribute_exists(${options.keyName})`
    }

    return this.client
      .update(updateParams)
      .promise()
      .catch((error) => <Error>error)
  }
}
