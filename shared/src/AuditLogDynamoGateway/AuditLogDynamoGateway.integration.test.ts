import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { isError } from "../types"
import AuditLog from "../AuditLog"
import { DynamoDbConfig } from "../DynamoGateway"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AuditLogDynamoGateway from "./AuditLogDynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "TestAuditLog"
}

const gateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const testGateway = new TestDynamoGateway(config)

describe("AuditLogDynamoGateway", () => {
  beforeAll(async () => {
    await testGateway.createTable(config.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = new AuditLog("ExpectedMessage", new Date(), "XML")

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <AuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessage.messageXml).toBe(expectedMessage.messageXml)
    })

    it("should return an error when the given message already exists", async () => {
      const message = new AuditLog("one", new Date(), "XML")
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })
  })

  it("should update one entry when key exists", async () => {
    const expectedMessageXml = "Updated XML"
    const message = new AuditLog("one", new Date(), "XML")
    await gateway.create(message)

    const params = {
      keyName: "messageId",
      keyValue: message.messageId,
      updateExpression: "set messageXml = :messageXml",
      updateExpressionValues: {
        ":messageXml": expectedMessageXml
      }
    }
    const result = await gateway.updateEntry(config.AUDIT_LOG_TABLE_NAME, params)

    expect(isError(result)).toBe(false)

    const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 3)
    const filteredRecords = actualRecords.Items?.filter((r) => r.messageId === message.messageId)

    expect(filteredRecords).toHaveLength(1)
    expect(filteredRecords[0].messageXml).toBe(expectedMessageXml)
  })

  // TODO: Proper testing for getting messages. Include date ordering.
})
