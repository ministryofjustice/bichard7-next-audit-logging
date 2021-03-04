import { isError } from "@handlers/common"
import { DynamoDbConfig } from "src/types"
import DynamoGateway from "../../src/gateways/DynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1"
}

const tableName = "DynamoTesting"

describe("DynamoGateway", () => {
  let gateway: DynamoGateway

  beforeAll(() => {
    gateway = new DynamoGateway(config)
  })

  describe("insertOne()", () => {
    it("should return undefined when successful", async () => {
      const record = {
        Id: "InsertOneRecord",
        SomeOtherValue: "SomeOtherValue"
      }

      const result = await gateway.insertOne(tableName, record)

      expect(result).toBeUndefined()
    })

    it("should return an error when there is a failure", async () => {
      const record = {
        Id: 1234,
        SomeOtherValue: "Id should be a number"
      }

      const result = await gateway.insertOne(tableName, record)

      expect(result).toBeTruthy()
      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe("One or more parameter values were invalid: Type mismatch for key")
    })
  })
})
