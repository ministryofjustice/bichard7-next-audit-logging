import { CreateTableOutput, DocumentClient } from "aws-sdk/clients/dynamodb"
import PollOptions from "../utils/PollOptions"
import Poller from "../utils/Poller"
import DynamoGateway from "./DynamoGateway"

type KeyValue = string | number | boolean

export default class TestDynamoGateway extends DynamoGateway {
  async tableExists(tableName: string): Promise<boolean> {
    const tableResult = await this.service.listTables().promise()
    return !!tableResult.TableNames?.find((name) => name === tableName)
  }

  async createTable(
    tableName: string,
    keyName: string,
    sortKey: string,
    skipIfExists = true
  ): Promise<CreateTableOutput | undefined> {
    if (skipIfExists && (await this.tableExists(tableName))) {
      return undefined
    }

    return this.service
      .createTable({
        AttributeDefinitions: [
          {
            AttributeName: keyName,
            AttributeType: "S"
          },
          {
            AttributeName: sortKey,
            AttributeType: "S"
          },
          {
            AttributeName: "_",
            AttributeType: "S"
          }
        ],
        KeySchema: [
          {
            AttributeName: keyName,
            KeyType: "HASH"
          }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: `${sortKey}Index`,
            KeySchema: [
              {
                AttributeName: "_",
                KeyType: "HASH"
              },
              {
                AttributeName: sortKey,
                KeyType: "RANGE"
              }
            ],
            Projection: {
              ProjectionType: "ALL"
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1
            }
          }
        ],
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

  async deleteAll(tableName: string, keyName: string): Promise<void> {
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
      throw new Error(`Failed to delete all items! Remaining Items: ${remainingItems.Count}`)
    }
  }
}
