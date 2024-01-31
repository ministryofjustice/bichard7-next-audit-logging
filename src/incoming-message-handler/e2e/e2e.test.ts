import { TestS3Gateway } from "src/shared"
import "src/shared/testing"
import { clearDynamoTable, setEnvironmentVariables } from "src/shared/testing"
import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import TestMqGateway from "../gateways/MqGateway/TestMqGateway"

process.env.INCOMING_MESSAGE_BUCKET_NAME = "internalIncomingBucket"
setEnvironmentVariables()

import type IncomingMessageSimulator from "./IncomingMessageSimulator"
import TestApi from "./TestApi"

const formatXml = (xml: string): string => format(xml, { indentation: "  " })

const expectedExternalCorrelationId = uuid()
const externalId = uuid()
const expectedCaseId = "41BP0510007"
const getOriginalXml = (externalCorrelationId: string, dataStreamUniqueValue?: string) =>
  formatXml(`
  <?xml version="1.0" encoding="UTF-8"?>
  <RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <RequestFromSystem>
      <CorrelationID>
        ${externalCorrelationId}
      </CorrelationID>
    </RequestFromSystem>
    <DataStream>
      <DataStreamContent>${dataStreamUniqueValue ? `<!-- ${dataStreamUniqueValue} -->` : ""}
        &lt;DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g"&gt;
          &lt;DC:Session&gt;
            &lt;DC:Case&gt;
              &lt;DC:PTIURN&gt;
                ${expectedCaseId}
              &lt;/DC:PTIURN&gt;
            &lt;/DC:Case&gt;
          &lt;/DC:Session&gt;
        &lt;/DC:ResultedCaseMessage&gt;
      </DataStreamContent>
    </DataStream>
  </RouteData>
`)

const s3Gateway = new TestS3Gateway({
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "internalIncomingBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
})

const getSimulator = () => new (require("./IncomingMessageSimulator").default)() as IncomingMessageSimulator

const testMqGateway = new TestMqGateway({
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin",
  queueName: "queue-will-be-set-in-test"
})

describe("e2e tests", () => {
  beforeEach(async () => {
    jest.resetModules()
    await clearDynamoTable("auditLogTable", "messageId")
    await clearDynamoTable("auditLogEventsTable", "_id")
    await s3Gateway.deleteAll()
  })

  afterAll(async () => {
    await testMqGateway.dispose()
  })

  it("should receive a message on the target queue when the message is sent to the S3 bucket", async () => {
    const queueName = "1_INCOMING_MESSAGE_HANDLER_QUEUE"
    process.env.MQ_QUEUE = queueName
    const fileName = `2021/03/15/12/28/${externalId}.xml`
    const expectedReceivedDate = new Date(2021, 2 /* March */, 15, 12, 28)
    const executionId = uuid()

    await getSimulator().start(fileName, getOriginalXml(expectedExternalCorrelationId), executionId)

    // Get messages from the API
    const api = new TestApi()
    const persistedMessages = await api.getMessages()
    expect(persistedMessages).toHaveLength(1)

    const persistedMessage = persistedMessages[0]
    expect(persistedMessage.externalCorrelationId).toBe(expectedExternalCorrelationId)
    expect(persistedMessage.caseId).toBe(expectedCaseId)
    expect(persistedMessage.createdBy).toBe("Incoming message handler")
    expect(persistedMessage.externalId).toBe(externalId)
    expect(persistedMessage.s3Path).toBe(fileName)

    // Received date will be a string as we currently pull it straight from the database without parsing
    expect(persistedMessage.receivedDate).toBe(expectedReceivedDate.toISOString())

    expect(persistedMessage.events).toBeDefined()
    expect(persistedMessage.events).toHaveLength(1)

    const persistedEvent = persistedMessage.events[0]
    expect(persistedEvent.category).toBe("information")
    expect(persistedEvent.eventCode).toBe("hearing-outcome.received-incoming")
    expect(persistedEvent.eventType).toBe("Message Sent to Bichard")
    expect(persistedEvent.eventSource).toBe("Incoming Message Handler")

    const actualMessage = await testMqGateway.getMessage(queueName)
    expect(actualMessage).toNotBeError()
  })

  it("should create a new audit log record for a duplicate message when the message is sent to the S3 bucket", async () => {
    const queueName = "2_INCOMING_MESSAGE_HANDLER_QUEUE"
    process.env.MQ_QUEUE = queueName
    const fileName = `2021/03/15/12/28/${externalId}.xml`
    const executionId = uuid()

    const duplicateMessageExternalId = uuid()
    const duplicateMessageFileName = `2021/03/15/12/29/${duplicateMessageExternalId}.xml`
    const duplicateMessageExecutionId = uuid()
    const duplicateMessageExternalCorrelationId = uuid()
    const dataUniqueValue = uuid()

    await getSimulator().start(fileName, getOriginalXml(expectedExternalCorrelationId, dataUniqueValue), executionId)
    await getSimulator().start(
      duplicateMessageFileName,
      getOriginalXml(duplicateMessageExternalCorrelationId, dataUniqueValue),
      duplicateMessageExecutionId
    )

    // Get messages from the API
    const api = new TestApi()
    const persistedMessages = await api.getMessages()
    expect(persistedMessages).toHaveLength(2)

    const originalMessage = persistedMessages.find((message) => message.s3Path === fileName)
    const duplicateMessage = persistedMessages.find((message) => message.s3Path === duplicateMessageFileName)
    expect(originalMessage).toBeDefined()
    expect(duplicateMessage).toBeDefined()
    expect(duplicateMessage?.messageHash).toBeDefined()
    expect(originalMessage?.messageId).not.toBe(duplicateMessage?.messageId)
    expect(originalMessage?.messageHash).toBe(duplicateMessage?.messageHash)

    const actualMessage = await testMqGateway.getMessage(queueName)
    expect(actualMessage).toNotBeError()
  })
})
