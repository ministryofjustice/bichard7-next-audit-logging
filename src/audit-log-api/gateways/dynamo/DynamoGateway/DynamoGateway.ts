import { DynamoDB } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import type { PromiseResult, TransactionFailureReason } from "src/shared/types"

import { isError, TransactionFailedError } from "src/shared/types"
import type DynamoDbConfig from "./DynamoDbConfig"
import type DynamoUpdate from "./DynamoUpdate"
import type FetchByIndexOptions from "./FetchByIndexOptions"
import type GetManyOptions from "./GetManyOptions"
import KeyComparison from "./KeyComparison"
import type UpdateOptions from "./UpdateOptions"

export type Projection = {
  expression: string
  attributeNames: {
    [key: string]: string
  }
}

export default class DynamoGateway {
  protected readonly service: DynamoDB

  protected readonly client: DocumentClient

  constructor(config: DynamoDbConfig) {
    this.service = new DynamoDB(config)

    this.client = new DocumentClient({
      service: this.service
    })
  }

  insertOne<T>(tableName: string, record: T, keyName: string): PromiseResult<void> {
    const params: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: { _: "_", ...record },
      ExpressionAttributeNames: { "#keyName": keyName },
      ConditionExpression: `attribute_not_exists(#keyName)`
    }

    return this.client
      .put(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  insertMany<T>(tableName: string, records: T[], keyName: string): PromiseResult<void> {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: records.map((record) => {
        return {
          Put: {
            TableName: tableName,
            Item: { _: "_", ...record },
            ConditionExpression: `attribute_not_exists(${keyName})`
          }
        }
      })
    }

    let failureReasons: TransactionFailureReason[]
    return this.client
      .transactWrite(params)
      .on("extractError", (response) => {
        try {
          failureReasons = JSON.parse(response.httpResponse.body.toString())
            .CancellationReasons as TransactionFailureReason[]
        } catch (error) {
          console.error("Error extracting cancellation error", error)
        }
      })
      .promise()
      .then(() => {
        return undefined
      })
      .catch((error) => {
        if (failureReasons) {
          return new TransactionFailedError(failureReasons, error.message)
        }
        return <Error>error
      })
  }

  replaceOne<T>(tableName: string, record: T, keyName: string, version: number): PromiseResult<void> {
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
    const { sortKey, projection } = options
    const { limit, lastItemKey } = options.pagination

    const { expression, attributeNames } = projection ?? {}

    const queryOptions: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      IndexName: `${sortKey}Index`,
      KeyConditionExpression: "#dummyKey = :dummyValue",
      ExpressionAttributeValues: {
        ":dummyValue": "_"
      },
      ExpressionAttributeNames: {
        "#dummyKey": "_",
        ...attributeNames
      },
      ProjectionExpression: expression,
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
    const {
      indexName,
      hashKeyName: attributeName,
      hashKeyValue: attributeValue,
      isAscendingOrder,
      projection
    } = options
    const { limit, lastItemKey } = options.pagination

    const { expression, attributeNames } = projection ?? {}

    const queryOptions: DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: "#keyName = :keyValue",
      ExpressionAttributeNames: {
        "#keyName": attributeName,
        ...attributeNames
      },
      ExpressionAttributeValues: {
        ":keyValue": attributeValue
      },
      ProjectionExpression: expression,
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
      if (options.rangeKeyComparison == KeyComparison.Equals) {
        queryOptions.KeyConditionExpression += " AND #rangeKeyName = :rangeKeyValue"
        queryOptions.ExpressionAttributeNames!["#rangeKeyName"] = options.rangeKeyName
        queryOptions.ExpressionAttributeValues![":rangeKeyValue"] = options.rangeKeyValue
      }
    }

    // set query options for between range key
    if (options.rangeKeyName && options.betweenKeyStart !== undefined && options.betweenKeyEnd !== undefined) {
      queryOptions.KeyConditionExpression += " AND #rangeKeyName BETWEEN :betweenKeyStart AND :betweenKeyEnd"
      queryOptions.ExpressionAttributeNames!["#rangeKeyName"] = options.rangeKeyName
      queryOptions.ExpressionAttributeValues![":betweenKeyStart"] = options.betweenKeyStart
      queryOptions.ExpressionAttributeValues![":betweenKeyEnd"] = options.betweenKeyEnd
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
    keyValue: unknown,
    projection?: Projection
  ): PromiseResult<DocumentClient.GetItemOutput | Error | null> {
    const { expression, attributeNames } = projection ?? {}

    return this.client
      .get({
        TableName: tableName,
        Key: {
          [keyName]: keyValue
        },
        ProjectionExpression: expression,
        ExpressionAttributeNames: attributeNames
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

  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void> {
    let failureReasons: TransactionFailureReason[] = []
    return this.client
      .transactWrite({ TransactItems: actions })
      .on("extractError", (response) => {
        // Error when we perform more actions than dynamodb supports
        // see https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
        if (response.error && response.error.message.startsWith("Member must have length less than or equal to")) {
          failureReasons.push({
            Code: "TooManyItems",
            Message: response.error.message
          })
        } else {
          // Save the returned reasons for the transaction failing as they are not returned
          try {
            failureReasons = JSON.parse(response.httpResponse.body.toString())
              .CancellationReasons as TransactionFailureReason[]
          } catch (error) {
            console.error("Error extracting cancellation error", error)
          }

          if (failureReasons === undefined || failureReasons.length < 1) {
            failureReasons = [
              {
                Code: "UnknownError",
                Message: response.httpResponse.body.toString()
              }
            ]
          }
        }
      })
      .promise()
      .then(() => {
        if (failureReasons.length > 0) {
          return new TransactionFailedError(failureReasons, failureReasons[0].Message)
        }
        return undefined
      })
      .catch((error) => {
        if (failureReasons.length > 0) {
          return new TransactionFailedError(failureReasons, error.message)
        }
        return <Error>error
      })
  }
}
