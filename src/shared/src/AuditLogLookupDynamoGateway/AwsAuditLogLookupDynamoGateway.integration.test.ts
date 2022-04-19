jest.retryTimes(10)
import "shared-testing"
import { v4 as uuid } from "uuid"
import type { DynamoDbConfig } from "shared-types"
import { isError, AuditLogLookup } from "shared-types"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AwsAuditLogLookupDynamoGateway from "./AwsAuditLogLookupDynamoGateway"
import { IndexSearcher } from ".."

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogLookupTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const gateway = new AwsAuditLogLookupDynamoGateway(config, config.TABLE_NAME)
const testGateway = new TestDynamoGateway(config)
const primaryKey = "id"

describe("AuditLogDynamoGateway", () => {
  beforeAll(async () => {
    const options = {
      keyName: primaryKey,
      secondaryIndexes: [
        {
          name: "messageIdIndex",
          hashKey: "messageId"
        }
      ],
      skipIfExists: true
    }

    await testGateway.createTable(config.TABLE_NAME, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.TABLE_NAME, primaryKey)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe("create()", () => {
    it("should insert the given lookup item", async () => {
      const expectedLookupItem = new AuditLogLookup("Expected value", "Dummy message ID")

      const result = await gateway.create(expectedLookupItem)

      expect(isError(result)).toBe(false)

      const actualLookupItem = <AuditLogLookup>result
      expect(actualLookupItem.id).toBe(expectedLookupItem.id)
      expect(actualLookupItem.value).toBe(expectedLookupItem.value)
      expect(actualLookupItem.messageId).toBe(expectedLookupItem.messageId)
    })

    it("should return an error when the given lookup item already exists", async () => {
      const lookupItem = new AuditLogLookup("Value", "Correlation ID")
      await gateway.create(lookupItem)

      const result = await gateway.create(lookupItem)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })
  })

  describe("fetchById", () => {
    it("should return the matching lookup item", async () => {
      const expectedLookupItem = new AuditLogLookup("Value 1", "MessageID")
      await gateway.create(expectedLookupItem)

      const result = await gateway.fetchById(expectedLookupItem.id)

      expect(isError(result)).toBe(false)

      const actualLookupItem = <AuditLogLookup>result
      expect(actualLookupItem.id).toBe(expectedLookupItem.id)
      expect(actualLookupItem.value).toBe(expectedLookupItem.value)
      expect(actualLookupItem.messageId).toBe(expectedLookupItem.messageId)
    })

    it("should return null when no lookup item matches the given id", async () => {
      const result = await gateway.fetchById("InvalidMessageId")

      expect(isError(result)).toBe(false)
      expect(result as AuditLogLookup).toBeUndefined()
    })
  })

  describe("fetchByMessageId", () => {
    it("should return an item for a specific message ID", async () => {
      const expectedLookupItem = new AuditLogLookup("Expected value 1", "Expected message ID")
      const anotherLookupItem = new AuditLogLookup("Expected value 2", "Dummy message ID")

      await testGateway.insertOne(config.TABLE_NAME, expectedLookupItem, "id")
      await testGateway.insertOne(config.TABLE_NAME, anotherLookupItem, "id")

      const result = await gateway.fetchByMessageId(expectedLookupItem.messageId)

      expect(isError(result)).toBe(false)

      const [{ id, messageId, value }] = result as AuditLogLookup[]
      expect(id).toStrictEqual(expectedLookupItem.id)
      expect(messageId).toStrictEqual(expectedLookupItem.messageId)
      expect(value).toStrictEqual(expectedLookupItem.value)
    })

    it("should return items for a specific message ID when last item is provided", async () => {
      const expectedMessageId = uuid()
      await Promise.all(
        [...Array(10).keys()].map((index) => {
          const item = new AuditLogLookup(`Expected value ${index}`, expectedMessageId)
          return testGateway.insertOne(config.TABLE_NAME, { ...item, id: `ID-${index}` }, "id")
        })
      )

      const insertedItems = (await testGateway.getAll(config.TABLE_NAME)).Items as AuditLogLookup[]

      expect(insertedItems).toHaveLength(10)

      const result = await gateway.fetchByMessageId(expectedMessageId, insertedItems.at(7))

      expect(isError(result)).toBe(false)

      const actualItems = result as AuditLogLookup[]
      expect(actualItems).toHaveLength(2)
      expect(actualItems[0]).toStrictEqual(insertedItems[8])
      expect(actualItems[1]).toStrictEqual(insertedItems[9])
    })

    it("should return error when DynamoDB returns error", async () => {
      const expectedError = new Error("Dummy error")
      jest.spyOn(IndexSearcher.prototype, "execute").mockResolvedValue(expectedError)

      const result = await gateway.fetchByMessageId("DummyMessageID")

      expect(isError(result)).toBe(true)

      const actualError = result as Error
      expect(actualError.message).toBe(expectedError.message)
    })
  })

  describe("fetchAllByMessageId", () => {
    it("should all items for a specific message ID", async () => {
      const fetchByMessageIdSpy = jest.spyOn(gateway, "fetchByMessageId")
      const expectedMessageId = uuid()
      await Promise.all(
        [...Array(15).keys()].map((index) => {
          const item = new AuditLogLookup(`Expected value ${index}`, expectedMessageId)
          return testGateway.insertOne(config.TABLE_NAME, { ...item, id: `ID-${index}` }, "id")
        })
      )

      const insertedItems = (await testGateway.getAll(config.TABLE_NAME)).Items as AuditLogLookup[]

      const result = await gateway.fetchAllByMessageId(expectedMessageId)

      expect(isError(result)).toBe(false)
      expect(fetchByMessageIdSpy).toHaveBeenCalledTimes(3)
      expect(result).toStrictEqual(insertedItems)
    })

    it("should return [] when message ID not found", async () => {
      const fetchByMessageIdSpy = jest.spyOn(gateway, "fetchByMessageId")

      const result = await gateway.fetchAllByMessageId("dummy")

      expect(isError(result)).toBe(false)
      expect(fetchByMessageIdSpy).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(0)
    })

    it("should return error when DynamoDB returns error", async () => {
      const expectedError = new Error("Dummy error")
      jest.spyOn(gateway, "fetchByMessageId").mockResolvedValue(expectedError)

      const result = await gateway.fetchAllByMessageId("DummyMessageID")

      expect(isError(result)).toBe(true)

      const actualError = result as Error
      expect(actualError.message).toBe(expectedError.message)
    })
  })

  describe("deleteByMessageId", () => {
    it("should delete all records with a specific message ID", async () => {
      const messageId = uuid()
      await Promise.all(
        [...Array(15).keys()].map((index) => {
          const item = new AuditLogLookup(`Record to delete ${index}`, messageId)
          return testGateway.insertOne(config.TABLE_NAME, { ...item, id: `ID-${index}` }, "id")
        })
      )

      const otherRecord = new AuditLogLookup(`Other record`, "otherMessageId")
      testGateway.insertOne(config.TABLE_NAME, otherRecord, "id")

      const result = await gateway.deleteByMessageId(messageId)
      expect(isError(result)).toBe(false)

      const recordsInDB = await testGateway.getAll(config.TABLE_NAME)
      expect(recordsInDB.Items).toEqual([{ _: "_", ...otherRecord }])
    })

    it("should return undefined when message ID not found", async () => {
      const result = await gateway.deleteByMessageId("dummy")

      expect(isError(result)).toBe(false)
      expect(result).toBeUndefined()
    })

    it("should return error when fetchAllByMessageId returns error", async () => {
      const expectedError = new Error("Dummy error")
      jest.spyOn(gateway, "fetchAllByMessageId").mockResolvedValue(expectedError)

      const result = await gateway.deleteByMessageId("DummyMessageID")

      expect(isError(result)).toBe(true)

      const actualError = result as Error
      expect(actualError.message).toBe(expectedError.message)
    })

    it("should return error when deleteMany returns error", async () => {
      const messageId = uuid()
      await Promise.all(
        [...Array(2).keys()].map((index) => {
          const item = new AuditLogLookup(`Record to delete ${index}`, messageId)
          return testGateway.insertOne(config.TABLE_NAME, { ...item, id: `ID-${index}` }, "id")
        })
      )

      const expectedError = new Error("Dummy error")
      jest.spyOn(gateway, "deleteMany").mockResolvedValue(expectedError)

      const result = await gateway.deleteByMessageId(messageId)

      expect(isError(result)).toBe(true)

      const actualError = result as Error
      expect(actualError.message).toBe(expectedError.message)
    })
  })
})
