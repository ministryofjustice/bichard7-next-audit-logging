import type { CreateTableOutput, DocumentClient } from "aws-sdk/clients/dynamodb"
import PollOptions from "../../utils/PollOptions"
import Poller from "../../utils/Poller"
import DynamoGateway from "../DynamoGateway"
import getTableAttributes from "./getTableAttributes"
import getTableIndexes from "./getTableIndexes"
import type { SecondaryIndex } from "./SecondaryIndex"

type KeyValue = string | number | boolean

interface CreateTableOptions {
  keyName: string
  sortKey?: string
  secondaryIndexes: SecondaryIndex[]
  skipIfExists: boolean
}

export default class TestDynamoGateway extends DynamoGateway {
  async tableExists(tableName: string): Promise<boolean> {
    const tableResult = await this.service.listTables().promise()
    return !!tableResult.TableNames?.find((name) => name === tableName)
  }

  async createTable(tableName: string, options: CreateTableOptions): Promise<CreateTableOutput | undefined> {
    const { keyName, sortKey, secondaryIndexes, skipIfExists } = options

    if (skipIfExists && (await this.tableExists(tableName))) {
      return undefined
    }

    const attributes = getTableAttributes(keyName, sortKey, secondaryIndexes)
    const indexes = sortKey ? getTableIndexes(sortKey, secondaryIndexes) : undefined

    return this.service
      .createTable({
        AttributeDefinitions: attributes,
        KeySchema: [
          {
            AttributeName: keyName,
            KeyType: "HASH"
          }
        ],
        GlobalSecondaryIndexes: indexes,
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        },
        TableName: tableName
      })
      .promise()
  }

  pollForMessages(tableName: string, timeout: number): Promise<DocumentClient.ScanOutput | undefined> {
    const poller = new Poller(async () => {
      const response = await this.getAll(tableName)

      if (!response || response.Count === 0) {
        return undefined
      }

      return response
    })

    return poller.poll(new PollOptions(timeout))
  }

  getAll(tableName: string): Promise<DocumentClient.ScanOutput> {
    return this.client
      .scan({
        TableName: tableName
      })
      .promise()
  }

  async getOne<T>(tableName: string, keyName: string, keyValue: KeyValue): Promise<T | null> {
    const result = await this.client
      .get({
        TableName: tableName,
        Key: {
          [keyName]: keyValue
        }
      })
      .promise()

    if (!result.Item) {
      return null
    }

    return <T>result.Item
  }

  async getManyById<T>(tableName: string, indexName: string, keyName: string, keyValue: KeyValue): Promise<T[] | null> {
    const result = await this.client
      .query({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: "#keyName = :keyValue",
        ExpressionAttributeNames: {
          "#keyName": keyName
        },
        ExpressionAttributeValues: {
          ":keyValue": keyValue
        }
      })
      .promise()

    if (!result.Items || result.Items.length < 1) {
      return null
    }

    return <T[]>result.Items
  }

  async deleteAll(tableName: string, keyName: string, attempts = 5): Promise<void> {
    const items = await this.getAll(tableName)

    const promises =
      items.Items?.map((item) =>
        this.client
          .delete({
            TableName: tableName,
            Key: {
              [keyName]: item[keyName]
            }
          })
          .promise()
      ) ?? []

    await Promise.all(promises)

    const remainingItems = await this.getAll(tableName)
    if (remainingItems.Count && remainingItems.Count > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (attempts > 0) {
        await this.deleteAll(tableName, keyName, attempts - 1)
      } else {
        throw new Error("Could not delete items from Dynamo table")
      }
    }
  }
}
