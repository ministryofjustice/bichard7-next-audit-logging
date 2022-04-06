jest.retryTimes(10)
import "shared-testing"
import type { DynamoDbConfig } from "shared-types"
import { isError, AuditLogLookup } from "shared-types"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AwsAuditLogLookupDynamoGateway from "./AwsAuditLogLookupDynamoGateway"

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
          name: "externalCorrelationIdIndex",
          hashKey: "externalCorrelationId"
        }
      ],
      skipIfExists: true
    }

    await testGateway.createTable(config.TABLE_NAME, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.TABLE_NAME, primaryKey)
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
})
