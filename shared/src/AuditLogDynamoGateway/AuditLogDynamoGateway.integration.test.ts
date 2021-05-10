import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { v4 as uuid } from "uuid"
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
    expectedEvent.eventSource = "Test event source"
    const expectedEventAttributes = {
      "Attribute one": "Some value",
      "Attribute two": 2
    }
    expectedEvent.attributes = expectedEventAttributes

    const message = new AuditLog("one", new Date(), "XML1")
    const otherMessage = new AuditLog("two", new Date(), "XML2")
    await gateway.create(message)
    await gateway.create(otherMessage)

    const result = await gateway.addEvent(message.messageId, expectedEvent)

    expect(isError(result)).toBe(false)

    const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, 2)

    const actualOtherMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === otherMessage.messageId)
    expect(actualOtherMessage).toBeDefined()
    expect(actualOtherMessage.events).toBeDefined()
    expect(actualOtherMessage.events).toHaveLength(0)

    const actualMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === message.messageId)
    expect(actualMessage).toBeDefined()
    expect(actualMessage.events).toBeDefined()
    expect(actualMessage.events).toHaveLength(1)

    const actualEvent = actualMessage.events[0]
    expect(actualEvent.eventSource).toBe(expectedEvent.eventSource)
    expect(actualEvent.category).toBe(expectedEvent.category)
    expect(actualEvent.timestamp).toBe(expectedEvent.timestamp)
    expect(actualEvent.eventType).toBe(expectedEvent.eventType)

    const actualEventAttributes = actualEvent.attributes
    expect(actualEventAttributes).toBeDefined()
    expect(actualEventAttributes["Attribute one"]).toBe("Some value")
    expect(actualEventAttributes["Attribute two"]).toBe(2)
  })

  it("should add two events to the audit log", async () => {
    const expectedEventOne = new AuditLogEvent("information", new Date(), "Test event one")
    expectedEventOne.eventSource = "Event source one"
    expectedEventOne.attributes = { EventOneAttribute: "Event one attribute" }
    const expectedEventTwo = new AuditLogEvent("error", new Date(), "Test event two")
    expectedEventTwo.eventSource = "Event source two"
    expectedEventTwo.attributes = { EventTwoAttribute: "Event two attribute" }

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

    const actualEventOne = actualMessage.events.find((e) => e.eventSource === expectedEventOne.eventSource)
    expect(actualEventOne.eventSource).toBe(expectedEventOne.eventSource)
    expect(actualEventOne.category).toBe(expectedEventOne.category)
    expect(actualEventOne.timestamp).toBe(expectedEventOne.timestamp)
    expect(actualEventOne.eventType).toBe(expectedEventOne.eventType)

    const actualEventOneAttributes = actualEventOne.attributes
    expect(actualEventOneAttributes).toBeDefined()
    expect(actualEventOneAttributes.EventOneAttribute).toBe(expectedEventOne.attributes.EventOneAttribute)

    const actualEventTwo = actualMessage.events.find((e) => e.eventSource === expectedEventTwo.eventSource)
    expect(actualEventTwo.eventSource).toBe(expectedEventTwo.eventSource)
    expect(actualEventTwo.category).toBe(expectedEventTwo.category)
    expect(actualEventTwo.timestamp).toBe(expectedEventTwo.timestamp)
    expect(actualEventTwo.eventType).toBe(expectedEventTwo.eventType)

    const actualEventTwoAttributes = actualEventTwo.attributes
    expect(actualEventTwoAttributes).toBeDefined()
    expect(actualEventTwoAttributes.EventTwoAttribute).toBe(expectedEventTwo.attributes.EventTwoAttribute)
  })

  it("should return error when audit log does not exist", async () => {
    const event = new AuditLogEvent("information", new Date(), "Test event one")
    const randomMessageId = uuid()

    const resultOne = await gateway.addEvent(randomMessageId, event)

    expect(isError(resultOne)).toBe(true)
  })

  // TODO: Proper testing for getting messages. Include date ordering.
})
