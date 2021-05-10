import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { isError } from "../types"
import DynamoDbConfig from "./DynamoDbConfig"
import TestDynamoGateway from "./TestDynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "DynamoTesting"
}

const gateway = new TestDynamoGateway(config)

describe("DynamoGateway", () => {
  beforeAll(async () => {
    await gateway.createTable(config.AUDIT_LOG_TABLE_NAME, "id")
  })

  describe("insertOne()", () => {
    beforeEach(async () => {
      await gateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "id")
    })

    it("should return undefined when successful and have inserted one record", async () => {
      const expectedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "SomeOtherValue"
      }

      const result = await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, expectedRecord, "id")

      expect(result).toBeUndefined()

      const actualRecords = await gateway.getAll(config.AUDIT_LOG_TABLE_NAME)
      expect(actualRecords.Count).toBe(1)

      const actualRecord = actualRecords.Items[0]
      expect(actualRecord.id).toBe(expectedRecord.id)
      expect(actualRecord.someOtherValue).toBe(expectedRecord.someOtherValue)
    })

    it("should return an error when there is a failure and have inserted zero records", async () => {
      const record = {
        id: 1234,
        someOtherValue: "Id should be a number"
      }

      const result = await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "id")

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("One or more parameter values were invalid: Type mismatch for key")

      const actualRecords = await gateway.getAll(config.AUDIT_LOG_TABLE_NAME)
      expect(actualRecords.Count).toBe(0)
    })
  })

  describe("getAll()", () => {
    beforeEach(async () => {
      await gateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "id")
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const record = {
            id: `Record ${i}`,
            someOtherValue: `Value ${i}`
          }
          await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "messageId")
        })
      )
    })

    it("should return limited amount of records", async () => {
      const actualRecords = await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 1)
      const results = <DocumentClient.ScanOutput>actualRecords
      expect(results.Count).toBe(1)
    })
  })

  describe("updateEntry()", () => {
    beforeEach(async () => {
      await gateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "id")
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const record = {
            id: `Record ${i}`,
            someOtherValue: `Value ${i}`
          }
          await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "messageId")
        })
      )
    })

    it("should update one entry when key exists", async () => {
      const recordId = "Record 1"
      const expectedValue = "Updated value"
      const params = {
        keyName: "id",
        keyValue: recordId,
        updateExpression: "set someOtherValue = :newValue",
        updateExpressionValues: {
          ":newValue": expectedValue
        }
      }
      const result = await gateway.updateEntry(config.AUDIT_LOG_TABLE_NAME, params)

      expect(isError(result)).toBe(false)

      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 3)
      const filteredRecords = actualRecords.Items?.filter((r) => r.id === recordId)

      expect(filteredRecords).toHaveLength(1)
      expect(filteredRecords[0].someOtherValue).toBe(expectedValue)
    })
  })
})
