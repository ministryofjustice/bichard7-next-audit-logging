import { AWSError, DynamoDB } from "aws-sdk"
import { PromiseResult } from "aws-sdk/lib/request"

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.setTimeout(60000)

const LOCALSTACK_URL = "http://localhost:4566"

declare type GetMessageResult = PromiseResult<DynamoDB.DocumentClient.GetItemOutput, AWSError>

async function seedTable(client: DynamoDB.DocumentClient, tableName: string, records: any[]): Promise<void> {
  let currentArray = records
  const promises: Promise<void>[] = []

  while (currentArray.length > 0) {
    const batch = currentArray.slice(0, 20)
    currentArray = currentArray.slice(20)

    const requests = batch.map((d) => ({
      PutRequest: {
        Item: { ...d }
      }
    }))

    const params = {
      RequestItems: {
        [tableName]: requests
      }
    }

    promises.push(
      client
        .batchWrite(params)
        .promise()
        .then(() => undefined)
    )
  }

  await Promise.all(promises)
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

function getDateFromIndex(index: number): string {
  const date = new Date("2021-01-01")

  // 10 records per day
  const days = Math.floor(index / 10)
  date.setDate(date.getDate() + days)

  return date.toISOString().split("T")[0]
}

describe("db integration tests", () => {
  const numberOfRecords = 1000

  let db: DynamoDB
  let client: DynamoDB.DocumentClient
  const messages: any[] = []

  beforeAll(() => {
    db = new DynamoDB({
      endpoint: LOCALSTACK_URL,
      region: "us-east-1",
      accessKeyId: "test",
      secretAccessKey: "test"
    })

    client = new DynamoDB.DocumentClient({
      service: db
    })

    for (let i = 1; i <= numberOfRecords; i++) {
      messages.push({
        MessageId: `Message${i}`,
        CaseNumber: i,
        ReceivedDate: getDateFromIndex(i)
      })
    }
  })

  describe("Scenario 1: Table with Partition Key = MessageId", () => {
    const tableName = "IncomingMessage"

    beforeAll(async () => {
      await seedTable(client, tableName, messages)
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

  describe("Scenario 2: Table with Partition Key = Received Date and Sort Key = Message Id", () => {
    const tableName = "IncomingMessageCompKey"

    beforeAll(async () => {
      await seedTable(client, tableName, messages)
    })

    it("Should get all messages", async () => {
      const result = await client.scan({ TableName: tableName }).promise()

      expect(result.Count).toBe(numberOfRecords)
    })

    it("Should get all messages by Received Date", async () => {
      const result = await client
        .query({
          TableName: tableName,
          KeyConditionExpression: "ReceivedDate = :receivedDate",
          ExpressionAttributeValues: {
            ":receivedDate": "2021-01-01" // day 1
          }
        })
        .promise()

      expect(result.Count).toBe(9)
    })

    it("Should get 1 message by Received Date and Message Id", async () => {
      const result = await client
        .get({
          TableName: tableName,
          Key: {
            ReceivedDate: "2021-01-01", // day 1
            MessageId: "Message5" // message on day 1
          }
        })
        .promise()

      expect(result.Item).toBeTruthy()
      expect(result.Item.MessageId).toBe("Message5")
      expect(result.Item.CaseNumber).toBe(5)
      expect(result.Item.ReceivedDate).toBe("2021-01-01")
    })

    it("Should get 1 message by Message Id using index", async () => {
      const result = await client
        .query({
          TableName: tableName,
          IndexName: "MessageIdIndex",
          KeyConditionExpression: "MessageId = :messageId",
          ExpressionAttributeValues: {
            ":messageId": "Message11"
          }
        })
        .promise()

      expect(result.Count).toBe(1)

      const actualItem = result.Items[0]
      expect(actualItem.MessageId).toBe("Message11")
      expect(actualItem.CaseNumber).toBe(11)
      expect(actualItem.ReceivedDate).toBe("2021-01-02")
    })
  })
})
