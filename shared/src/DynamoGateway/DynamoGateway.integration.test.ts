import type { DocumentClient, GetItemOutput } from "aws-sdk/clients/dynamodb"
import type UpdateOptions from "./UpdateOptions"
import { isError } from "../types"
import type DynamoDbConfig from "./DynamoDbConfig"
import TestDynamoGateway from "./TestDynamoGateway"
import type GetManyOptions from "./GetManyOptions"
import type FetchByIndexOptions from "./FetchByIndexOptions"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "DynamoTesting"
}

const gateway = new TestDynamoGateway(config)
const sortKey = "someOtherValue"

describe("DynamoGateway", () => {
  beforeAll(async () => {
    const options = {
      keyName: "id",
      sortKey: "someOtherValue",
      secondaryIndexes: [
        {
          name: "someOtherValueSecondaryIndex",
          hashKey: "someOtherValue"
        }
      ],
      skipIfExists: true
    }

    await gateway.createTable(config.AUDIT_LOG_TABLE_NAME, options)
  })

  beforeEach(async () => {
    await gateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "id")
  })

  describe("insertOne()", () => {
    it("should return undefined when successful and have inserted one record", async () => {
      const expectedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "SomeOtherValue"
      }

      const result = await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, expectedRecord, "id")

      expect(result).toBeUndefined()

      const actualRecords = await gateway.getAll(config.AUDIT_LOG_TABLE_NAME)
      expect(actualRecords.Count).toBe(1)

      const actualRecord = actualRecords.Items?.[0]
      expect(actualRecord?.id).toBe(expectedRecord.id)
      expect(actualRecord?.someOtherValue).toBe(expectedRecord.someOtherValue)
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

  describe("getMany()", () => {
    beforeEach(async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const record = {
            id: `Record ${i}`,
            someOtherValue: `Value ${i}`
          }

          await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "id")
        })
      )
    })

    it("should return limited amount of records", async () => {
      const options: GetManyOptions = {
        sortKey,
        pagination: { limit: 1 }
      }
      const actualRecords = await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, options)
      const results = <DocumentClient.ScanOutput>actualRecords
      expect(results.Count).toBe(1)
    })

    it("should return records ordered by sort key", async () => {
      const options: GetManyOptions = {
        sortKey,
        pagination: { limit: 3 }
      }
      const actualRecords = await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, options)
      const results = <DocumentClient.ScanOutput>actualRecords
      expect(results.Count).toBe(3)

      const items = results.Items
      expect(items?.[0].someOtherValue).toBe("Value 2")
      expect(items?.[1].someOtherValue).toBe("Value 1")
      expect(items?.[2].someOtherValue).toBe("Value 0")
    })

    it("should return records from the last key provided", async () => {
      const lastItemKey = { id: "Record 1", someOtherValue: "Value 1" }
      const options: GetManyOptions = {
        sortKey,
        pagination: {
          limit: 1,
          lastItemKey
        }
      }
      const actualRecords = await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, options)
      const results = <DocumentClient.ScanOutput>actualRecords
      expect(results.Count).toBe(1)

      const item = results.Items![0]
      expect(item.id).toBe("Record 0")
      expect(item.someOtherValue).toBe("Value 0")
    })
  })

  describe("fetchByIndex()", () => {
    beforeEach(async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const record = {
            id: `Record ${i}`,
            someOtherValue: `Value ${i}`
          }

          await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "id")
        })
      )
    })

    it("should return one record when key value exists", async () => {
      const options: FetchByIndexOptions = {
        indexName: "someOtherValueSecondaryIndex",
        attributeName: "someOtherValue",
        attributeValue: "Value 1",
        pagination: { limit: 10 }
      }

      const actualRecords = await gateway.fetchByIndex(config.AUDIT_LOG_TABLE_NAME, options)

      expect(isError(actualRecords)).toBe(false)

      const results = <DocumentClient.QueryOutput>actualRecords
      expect(results.Count).toBe(1)

      const item = results.Items![0]
      expect(item.id).toBe("Record 1")
      expect(item.someOtherValue).toBe("Value 1")
    })

    it("should return null when key value does not exist", async () => {
      const options: FetchByIndexOptions = {
        indexName: "someOtherValueSecondaryIndex",
        attributeName: "someOtherValue",
        attributeValue: "Value doesn't exist",
        pagination: { limit: 10 }
      }

      const actualRecords = await gateway.fetchByIndex(config.AUDIT_LOG_TABLE_NAME, options)

      expect(isError(actualRecords)).toBe(false)

      const results = <DocumentClient.QueryOutput>actualRecords
      expect(results.Count).toBe(0)
    })
  })

  describe("getOne()", () => {
    it("should return the item with matching key", async () => {
      const expectedRecord = {
        id: "Record1",
        someOtherValue: "Value 1"
      }

      await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, expectedRecord, "id")

      const actualRecord = await gateway.getOne<{ id: string; someOtherValue: string }>(
        config.AUDIT_LOG_TABLE_NAME,
        "id",
        "Record1"
      )

      expect(actualRecord).toBeDefined()
      expect(actualRecord?.id).toBe(expectedRecord.id)
      expect(actualRecord?.someOtherValue).toBe(expectedRecord.someOtherValue)
    })

    it("should return null when no item has a matching key", async () => {
      const result = await gateway.getOne(config.AUDIT_LOG_TABLE_NAME, "id", "InvalidKey")

      expect(isError(result)).toBe(false)
      expect(result).toBeNull()
    })
  })

  describe("getRecordVersion()", () => {
    it("should return only record version when key exists", async () => {
      const expectedRecord = {
        id: "Record1",
        someOtherValue: "Value 1",
        version: 1
      }

      await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, expectedRecord, "id")

      const result = await gateway.getRecordVersion(config.AUDIT_LOG_TABLE_NAME, "id", "Record1")

      expect(result).toBeDefined()
      expect(isError(result)).toBe(false)

      const itemResult = result as GetItemOutput
      expect(itemResult.Item).toBeDefined()

      const actualRecord = itemResult.Item as { id: string; someOtherValue: string; version: number }
      expect(actualRecord?.id).toBeUndefined()
      expect(actualRecord?.someOtherValue).toBeUndefined()
      expect(actualRecord?.version).toBe(expectedRecord.version)
    })

    it("should return null when no item has a matching key", async () => {
      const result = await gateway.getRecordVersion(config.AUDIT_LOG_TABLE_NAME, "id", "InvalidKey")

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const itemResult = result as GetItemOutput
      expect(itemResult.Item).toBeUndefined()
    })
  })

  describe("updateEntry()", () => {
    beforeEach(async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const record = {
            id: `Record ${i}`,
            someOtherValue: `Value ${i}`,
            version: 0
          }
          await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "messageId")
        })
      )
    })

    it("should update one entry when key exists", async () => {
      const recordId = "Record 1"
      const expectedValue = "Updated value"
      const options: UpdateOptions = {
        keyName: "id",
        keyValue: recordId,
        updateExpression: "set #attributeName = :newValue",
        expressionAttributeNames: {
          "#attributeName": "someOtherValue"
        },
        updateExpressionValues: {
          ":newValue": expectedValue
        },
        currentVersion: 0
      }
      const result = await gateway.updateEntry(config.AUDIT_LOG_TABLE_NAME, options)

      expect(isError(result)).toBe(false)

      const getManyOptions: GetManyOptions = {
        sortKey,
        pagination: { limit: 3 }
      }
      const actualRecords = <DocumentClient.ScanOutput>(
        await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, getManyOptions)
      )
      expect(isError(actualRecords)).toBeFalsy()

      const filteredRecords = actualRecords.Items?.filter((r) => r.id === recordId)
      expect(filteredRecords).toHaveLength(1)
      expect(filteredRecords?.[0].someOtherValue).toBe(expectedValue)
    })

    it("should return error when key does not exist", async () => {
      const recordId = "Invalid record Id"
      const options: UpdateOptions = {
        keyName: "id",
        keyValue: recordId,
        updateExpression: "set someOtherValue = :newValue",
        updateExpressionValues: {
          ":newValue": "Some value"
        },
        currentVersion: 0
      }
      const result = await gateway.updateEntry(config.AUDIT_LOG_TABLE_NAME, options)

      expect(isError(result)).toBe(true)
    })

    it("should return error when current version does not match the value in the database", async () => {
      const recordId = "Record 1"
      const options: UpdateOptions = {
        keyName: "id",
        keyValue: recordId,
        updateExpression: "set someOtherValue = :newValue",
        updateExpressionValues: {
          ":newValue": "Some value"
        },
        currentVersion: 1
      }
      const result = await gateway.updateEntry(config.AUDIT_LOG_TABLE_NAME, options)

      expect(isError(result)).toBe(true)
    })
  })
})
