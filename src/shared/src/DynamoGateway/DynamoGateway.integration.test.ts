jest.retryTimes(10)
import type { DocumentClient, GetItemOutput } from "aws-sdk/clients/dynamodb"
import type UpdateOptions from "./UpdateOptions"
import { isError } from "shared-types"
import type { DynamoDbConfig } from "shared-types"
import TestDynamoGateway from "./TestDynamoGateway"
import type GetManyOptions from "./GetManyOptions"
import type FetchByIndexOptions from "./FetchByIndexOptions"
import DynamoGateway from "./DynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "DynamoTesting",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const testGateway = new TestDynamoGateway(config)
const gateway = new DynamoGateway(config)
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

    await testGateway.createTable(config.TABLE_NAME, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.TABLE_NAME, "id")
  })

  describe("insertOne()", () => {
    it("should return undefined when successful and have inserted one record", async () => {
      const expectedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "SomeOtherValue"
      }

      const result = await gateway.insertOne(config.TABLE_NAME, expectedRecord, "id")

      expect(result).toBeUndefined()

      const actualRecords = await testGateway.getAll(config.TABLE_NAME)
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

      const result = await gateway.insertOne(config.TABLE_NAME, record, "id")

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("One or more parameter values were invalid: Type mismatch for key")

      const actualRecords = await testGateway.getAll(config.TABLE_NAME)
      expect(actualRecords.Count).toBe(0)
    })
  })

  describe("updateOne()", () => {
    it("should return error when the record does not exist in dynamoDB", async () => {
      const record = {
        id: "InsertOneRecord",
        someOtherValue: "SomeOtherValue",
        version: 1
      }

      const result = await gateway.updateOne(config.TABLE_NAME, record, "id", 1)

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("The conditional request failed")
    })

    it("should return undefined when successful and have updated one record", async () => {
      const oldRecord = {
        id: "InsertOneRecord",
        someOtherValue: "OldValue",
        version: 1
      }

      await testGateway.insertOne(config.TABLE_NAME, oldRecord, "id")

      const updatedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "NewValue",
        version: 2
      }
      const result = await gateway.updateOne(config.TABLE_NAME, updatedRecord, "id", 1)

      expect(result).toBeUndefined()

      const actualRecords = await testGateway.getAll(config.TABLE_NAME)
      expect(actualRecords.Count).toBe(1)

      const actualRecord = actualRecords.Items?.[0]
      expect(actualRecord?.id).toBe(updatedRecord.id)
      expect(actualRecord?.someOtherValue).toBe(updatedRecord.someOtherValue)
    })

    it("should return error if the version is different", async () => {
      const oldRecord = {
        id: "InsertOneRecord",
        someOtherValue: "OldValue",
        version: 1
      }

      await testGateway.insertOne(config.TABLE_NAME, oldRecord, "id")

      const updatedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "NewValue",
        version: 2
      }
      const result = await gateway.updateOne(config.TABLE_NAME, updatedRecord, "id", 2)

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("The conditional request failed")
    })

    it("should return an error when there is a failure and have inserted zero records", async () => {
      const record = {
        id: 1234,
        someOtherValue: "Id should be a number",
        version: 1
      }

      const result = await gateway.updateOne(config.TABLE_NAME, record, "id", 1)

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("One or more parameter values were invalid: Type mismatch for key")

      const actualRecords = await testGateway.getAll(config.TABLE_NAME)
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

          await testGateway.insertOne(config.TABLE_NAME, record, "id")
        })
      )
    })

    it("should return limited amount of records", async () => {
      const options: GetManyOptions = {
        sortKey,
        pagination: { limit: 1 }
      }
      const actualRecords = await gateway.getMany(config.TABLE_NAME, options)
      const results = <DocumentClient.ScanOutput>actualRecords
      expect(results.Count).toBe(1)
    })

    it("should return records ordered by sort key", async () => {
      const options: GetManyOptions = {
        sortKey,
        pagination: { limit: 3 }
      }
      const actualRecords = await gateway.getMany(config.TABLE_NAME, options)
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
      const actualRecords = await gateway.getMany(config.TABLE_NAME, options)
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

          await testGateway.insertOne(config.TABLE_NAME, record, "id")
        })
      )
    })

    it("should return one record when key value exists", async () => {
      const options: FetchByIndexOptions = {
        indexName: "someOtherValueSecondaryIndex",
        hashKeyName: "someOtherValue",
        hashKeyValue: "Value 1",
        pagination: { limit: 10 }
      }

      const actualRecords = await gateway.fetchByIndex(config.TABLE_NAME, options)

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
        hashKeyName: "someOtherValue",
        hashKeyValue: "Value doesn't exist",
        pagination: { limit: 10 }
      }

      const actualRecords = await gateway.fetchByIndex(config.TABLE_NAME, options)

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

      await testGateway.insertOne(config.TABLE_NAME, expectedRecord, "id")

      const result = await gateway.getOne(config.TABLE_NAME, "id", "Record1")

      const { Item: actualRecord } = result as {
        Item: {
          id: string
          someOtherValue: string
        }
      }
      expect(actualRecord).toBeDefined()
      expect(actualRecord?.id).toBe(expectedRecord.id)
      expect(actualRecord?.someOtherValue).toBe(expectedRecord.someOtherValue)
    })

    it("should return null when no item has a matching key", async () => {
      const result = await testGateway.getOne(config.TABLE_NAME, "id", "InvalidKey")

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

      await testGateway.insertOne(config.TABLE_NAME, expectedRecord, "id")

      const result = await gateway.getRecordVersion(config.TABLE_NAME, "id", "Record1")

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
      const result = await gateway.getRecordVersion(config.TABLE_NAME, "id", "InvalidKey")

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
          await testGateway.insertOne(config.TABLE_NAME, record, "messageId")
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
      const result = await gateway.updateEntry(config.TABLE_NAME, options)

      expect(isError(result)).toBe(false)

      const getManyOptions: GetManyOptions = {
        sortKey,
        pagination: { limit: 3 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await testGateway.getMany(config.TABLE_NAME, getManyOptions)
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
      const result = await gateway.updateEntry(config.TABLE_NAME, options)

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
      const result = await gateway.updateEntry(config.TABLE_NAME, options)

      expect(isError(result)).toBe(true)
    })
  })

  describe("deleteMany", () => {
    it("should delete all items when items exist in the table", async () => {
      const ids = ["item-1", "item-2"]
      await Promise.all(
        ids.map((id) => {
          const item = {
            id,
            someOtherValue: "OldValue"
          }
          return testGateway.insertOne(config.TABLE_NAME, item, "id")
        })
      )

      const deleteResult = await gateway.deleteMany(config.TABLE_NAME, "id", ids)

      expect(isError(deleteResult)).toBe(false)

      const getResult = await testGateway.getAll(config.TABLE_NAME)

      expect(getResult.Items).toHaveLength(0)
    })

    it("should be successful when items do not exist in the table", async () => {
      const ids = ["item-1", "item-2"]
      const deleteResult = await gateway.deleteMany(config.TABLE_NAME, "id", ids)

      expect(isError(deleteResult)).toBe(false)
    })

    it("should return error when DynamoDB returns an error", async () => {
      const ids = ["item-1", "item-2"]
      const deleteResult = await gateway.deleteMany(config.TABLE_NAME, "invalid field", ids)

      expect(isError(deleteResult)).toBe(true)

      const actualError = deleteResult as Error
      expect(actualError.message).toBe("One of the required keys was not given a value")
    })
  })
})
