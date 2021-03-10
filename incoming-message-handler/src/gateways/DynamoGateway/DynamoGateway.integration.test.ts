import { isError } from "@handlers/common"
import { DynamoDbConfig } from "../../configs"
import TestDynamoGateway from "./TestDynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1"
}

const tableName = "DynamoTesting"

describe("DynamoGateway", () => {
  let gateway: TestDynamoGateway

  beforeAll(() => {
    gateway = new TestDynamoGateway(config)
  })

  describe("insertOne()", () => {
    beforeEach(async () => {
      await gateway.deleteAll(tableName, "id")
    })

    it("should return undefined when successful and have inserted one record", async () => {
      const expectedRecord = {
        id: "InsertOneRecord",
        someOtherValue: "SomeOtherValue"
      }

      const result = await gateway.insertOne(tableName, expectedRecord, "id")

      expect(result).toBeUndefined()

      const actualRecords = await gateway.getAll(tableName)
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

      const result = await gateway.insertOne(tableName, record, "id")

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("One or more parameter values were invalid: Type mismatch for key")

      const actualRecords = await gateway.getAll(tableName)
      expect(actualRecords.Count).toBe(0)
    })
  })
})
