import { isError } from "@handlers/common"
import { DynamoDbConfig } from "../../types"
import IncomingMessage from "../../entities/IncomingMessage"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import IncomingMessageDynamoGateway from "./IncomingMessageDynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1"
}

const tableName = "IncomingMessage"

const gateway = new IncomingMessageDynamoGateway(config, tableName)
const testGateway = new TestDynamoGateway(config)

describe("IncomingMessageDynamoGateway", () => {
  beforeAll(async () => {
    await testGateway.deleteAll(tableName, "messageId")
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = new IncomingMessage("ExpectedMessage", new Date())

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <IncomingMessage>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    })

    it("should return an error when the given message already exists", async () => {
      const message = new IncomingMessage("one", new Date())
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })
  })
})
