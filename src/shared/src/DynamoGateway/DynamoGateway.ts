import { DynamoDB } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import type { DynamoDbConfig, PromiseResult, UnconditionalUpdateOptions } from "shared-types"
import { isError } from "shared-types"
import type FetchByIndexOptions from "./FetchByIndexOptions"
import type GetManyOptions from "./GetManyOptions"
import KeyComparison from "./KeyComparison"
import type UpdateOptions from "./UpdateOptions"

export default class DynamoGateway {
  protected readonly service: DynamoDB

  protected readonly client: DocumentClient

  constructor(config: DynamoDbConfig) {
    const conf: DynamoDB.ClientConfiguration = {
      endpoint: config.DYNAMO_URL,
      region: config.DYNAMO_REGION,
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY
    }

    this.service = new DynamoDB(conf)

    this.client = new DocumentClient({
      service: this.service
    })
  }

  insertOne<T>(tableName: string, record: T, keyName: string): PromiseResult<void> {
    const params: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: { _: "_", ...record },
      ConditionExpression: `attribute_not_exists(${keyName})`
    }

    return this.client
      .put(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  updateOne<T>(tableName: string, record: T, keyName: string, version: number): PromiseResult<void> {
    const params: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: { _: "_", ...record },
      ConditionExpression: `attribute_exists(${keyName}) and version = :version`,
      ExpressionAttributeValues: {
        ":version": version
      }
    }

    return this.client
      .put(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  getMany(tableName: string, options: GetManyOptions): PromiseResult<DocumentClient.QueryOutput> {
    const { sortKey } = options
    const { limit, lastItemKey } = options.pagination

    const queryOptions: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      IndexName: `${sortKey}Index`,
      KeyConditionExpression: "#dummyKey = :dummyValue",
      ExpressionAttributeValues: {
        ":dummyValue": "_"
      },
      ExpressionAttributeNames: {
        "#dummyKey": "_"
      },
      Limit: limit,
      ScanIndexForward: false // Descending order
    }

    if (lastItemKey) {
      queryOptions.ExclusiveStartKey = { ...lastItemKey, _: "_" }
    }

    return this.client
      .query(queryOptions)
      .promise()
      .catch((error) => <Error>error)
  }

  fetchByIndex(tableName: string, options: FetchByIndexOptions): PromiseResult<DocumentClient.QueryOutput> {
    const { indexName, hashKeyName: attributeName, hashKeyValue: attributeValue, isAscendingOrder } = options
    const { limit, lastItemKey } = options.pagination

    const queryOptions: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: "#keyName = :keyValue",
      ExpressionAttributeNames: {
        "#keyName": attributeName
      },
      ExpressionAttributeValues: {
        ":keyValue": attributeValue
      },
      ScanIndexForward: isAscendingOrder,
      Limit: limit,
      ExclusiveStartKey: lastItemKey
    }

    // set query options for comparison to a range key value
    if (options.rangeKeyName && options.rangeKeyValue !== undefined && options.rangeKeyComparison !== undefined) {
      if (options.rangeKeyComparison == KeyComparison.LessThanOrEqual) {
        queryOptions.KeyConditionExpression += " AND #rangeKeyName <= :rangeKeyValue"
        queryOptions.ExpressionAttributeNames!["#rangeKeyName"] = options.rangeKeyName
        queryOptions.ExpressionAttributeValues![":rangeKeyValue"] = options.rangeKeyValue
      }
    }

    // set query options for the filter if given
    if (options.filterKeyName && options.filterKeyValue !== undefined && options.filterKeyComparison !== undefined) {
      if (options.filterKeyComparison == KeyComparison.LessThanOrEqual) {
        queryOptions.FilterExpression = "#filterKeyName <= :filterKeyValue"
        queryOptions.ExpressionAttributeNames!["#filterKeyName"] = options.filterKeyName
        queryOptions.ExpressionAttributeValues![":filterKeyValue"] = options.filterKeyValue
      }
    }

    return this.client
      .query(queryOptions)
      .promise()
      .catch((error) => <Error>error)
  }

  getOne(
    tableName: string,
    keyName: string,
    keyValue: unknown
  ): PromiseResult<DocumentClient.GetItemOutput | Error | null> {
    return this.client
      .get({
        TableName: tableName,
        Key: {
          [keyName]: keyValue
        }
      })
      .promise()
      .catch((error) => <Error>error)
  }

  getRecordVersion(
    tableName: string,
    keyName: string,
    keyValue: unknown
  ): PromiseResult<DocumentClient.GetItemOutput | Error | null> {
    return this.client
      .get({
        TableName: tableName,
        Key: {
          [keyName]: keyValue
        },
        ProjectionExpression: "version"
      })
      .promise()
      .catch((error) => <Error>error)
  }

  updateEntry(tableName: string, options: UpdateOptions): PromiseResult<DocumentClient.UpdateItemOutput> {
    const { keyName, keyValue, expressionAttributeNames } = options
    const expressionAttributeValues = {
      ...options.updateExpressionValues,
      ":version": options.currentVersion,
      ":version_increment": 1
    }
    const updateExpression = `${options.updateExpression} ADD version :version_increment`

    const updateParams = <DocumentClient.UpdateItemInput>{
      TableName: tableName,
      Key: {
        [keyName]: keyValue
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ConditionExpression: `attribute_exists(${keyName}) and version = :version`
    }

    return this.client
      .update(updateParams)
      .promise()
      .catch((error) => <Error>error)
  }

  // Updates an entry in Dynamo without checking versions (unconditionally)
  updateEntryUnconditionally(
    tableName: string,
    options: UnconditionalUpdateOptions
  ): PromiseResult<DocumentClient.UpdateItemOutput> {
    const { keyName, keyValue, expressionAttributeNames } = options
    const expressionAttributeValues = {
      ...options.updateExpressionValues,
      ":version_increment": 1
    }
    const updateExpression = `${options.updateExpression} ADD version :version_increment`

    const updateParams = <DocumentClient.UpdateItemInput>{
      TableName: tableName,
      Key: {
        [keyName]: keyValue
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ConditionExpression: `attribute_exists(${keyName})`
    }

    return this.client
      .update(updateParams)
      .promise()
      .catch((error) => <Error>error)
  }

  async deleteMany(tableName: string, keyName: string, keyValues: string[]): PromiseResult<void> {
    for (const keyValue of keyValues) {
      const result = await this.client
        .delete({
          TableName: tableName,
          Key: {
            [keyName]: keyValue
          }
        })
        .promise()
        .catch((error) => <Error>error)

      if (isError(result)) {
        return result
      }
    }
  }
}
