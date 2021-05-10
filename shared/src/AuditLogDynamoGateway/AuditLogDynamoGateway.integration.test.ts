import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { isError } from "../types"
import AuditLog from "../AuditLog"
import { DynamoDbConfig } from "../DynamoGateway"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AuditLogDynamoGateway from "./AuditLogDynamoGateway"
import { AuditLogEvent } from ".."

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

  it("should only add an event to the specified audit log", async () => {
    const expectedEvent = new AuditLogEvent("information", new Date(), "Test event")
    const message = new AuditLog("one", new Date(), "XML1")
    const otherMessage = new AuditLog("two", new Date(), "XML2")
    await gateway.create(message)
    await gateway.create(otherMessage)

    const result = await gateway.addEvent(message.messageId, expectedEvent)

    expect(isError(result)).toBe(false)

    const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 2)

    const actualOtherMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === otherMessage.messageId)
    expect(actualOtherMessage).toBeDefined()
    expect(actualOtherMessage.events).toBeUndefined()

    const actualMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === message.messageId)
    expect(actualMessage).toBeDefined()
    expect(actualMessage.events).toBeDefined()
    expect(actualMessage.events).toHaveLength(1)

    const actualEvent = actualMessage.events[0]
    expect(actualEvent.eventType).toBe(expectedEvent.eventType)
  })

  it("should add two events to the audit log", async () => {
    const expectedEventOne = new AuditLogEvent("information", new Date(), "Test event one")
    const expectedEventTwo = new AuditLogEvent("error", new Date(), "Test event two")
    const message = new AuditLog("one", new Date(), "XML")
    await gateway.create(message)

    const resultOne = await gateway.addEvent(message.messageId, expectedEventOne)
    expect(isError(resultOne)).toBe(false)

    const resultTwo = await gateway.addEvent(message.messageId, expectedEventTwo)
    expect(isError(resultTwo)).toBe(false)

    const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 1)

    const actualMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === message.messageId)
    expect(actualMessage).toBeDefined()
    expect(actualMessage.events).toBeDefined()
    expect(actualMessage.events).toHaveLength(2)

    const actualEventOne = actualMessage.events[0]
    expect(actualEventOne.eventType).toBe(expectedEventOne.eventType)
    expect(actualEventOne.category).toBe(expectedEventOne.category)

    const actualEventTwo = actualMessage.events[1]
    expect(actualEventTwo.eventType).toBe(expectedEventTwo.eventType)
    expect(actualEventTwo.category).toBe(expectedEventTwo.category)
  })

  // TODO: Proper testing for getting messages. Include date ordering.
})
