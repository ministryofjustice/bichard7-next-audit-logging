import { AWSError, DynamoDB } from "aws-sdk"
import { PromiseResult } from "aws-sdk/lib/request"

const LOCALSTACK_URL = "http://localhost:4566"

declare type SeedResult = PromiseResult<DynamoDB.DocumentClient.BatchWriteItemOutput, AWSError>
declare type GetMessageResult = PromiseResult<DynamoDB.DocumentClient.GetItemOutput, AWSError>

async function seedTable(client: DynamoDB.DocumentClient, tableName: string, records: any[]): Promise<SeedResult> {
  const requests = records.map((d) => ({
    PutRequest: {
      Item: { ...d }
    }
  }))

  const params = {
    RequestItems: {
      [tableName]: requests
    }
  }

  return await client.batchWrite(params).promise()
}

async function getByMessageId(client: DynamoDB.DocumentClient, messageId: string): Promise<GetMessageResult> {
  const params = {
    TableName: "IncomingMessage",
    Key: {
      MessageId: messageId
    }
  }

  return client.get(params).promise()
}

describe("db integration tests", () => {
  describe("Scenario 1: Table with Partition Key = MessageId", () => {
    let db: DynamoDB
    let client: DynamoDB.DocumentClient

    const tableName = "IncomingMessage"
    const numberOfRecords = 10

    beforeAll(async () => {
      db = new DynamoDB({
        endpoint: LOCALSTACK_URL,
        region: "us-east-1",
        accessKeyId: "test",
        secretAccessKey: "test"
      })

      client = new DynamoDB.DocumentClient({
        service: db
      })

      const records = []
      for (let i = 1; i <= numberOfRecords; i++) {
        records.push({
          MessageId: `Message${i}`,
          CaseNumber: i
        })
      }

      await seedTable(client, tableName, records)
    })

    it("Should get all messages", async () => {
      const result = await client.scan({ TableName: tableName }).promise()

      expect(result.Count).toBe(numberOfRecords)
    })

    it("Should get 1 message by Message Id", async () => {
      const result: any = await getByMessageId(client, "Message5").catch((err) => console.error(err))

      expect(result.Item).toBeTruthy()
      expect(result.Item.MessageId).toBe("Message5")
      expect(result.Item.CaseNumber).toBe(5)
    })

    it("Should get 1 message by Case Number", async () => {
      const result = await client
        .query({
          TableName: "IncomingMessage",
          IndexName: "CaseNumberIndex",
          KeyConditionExpression: "CaseNumber = :caseNumber",
          ExpressionAttributeValues: {
            ":caseNumber": 5
          }
        })
        .promise()

      expect(result.Items.length).toBe(1)

      const actualItem = result.Items[0]
      expect(actualItem).toBeTruthy()
      expect(actualItem.MessageId).toBe("Message5")
      expect(actualItem.CaseNumber).toBe(5)
    })
  })
})
