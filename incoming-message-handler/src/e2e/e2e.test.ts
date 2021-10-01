import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import type { DynamoDbConfig } from "shared"
import { isError } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import TestS3Gateway from "shared/dist/S3Gateway/TestS3Gateway"
import TestMqGateway from "src/gateways/MqGateway/TestMqGateway"
import replaceMessageIdInXml from "src/use-cases/replaceMessageIdInXml"
import IncomingMessageSimulator from "./IncomingMessageSimulator"
import TestApi from "./TestApi"

jest.setTimeout(60000)

const formatXml = (xml: string): string => format(xml, { indentation: "  " })

const expectedExternalCorrelationId = uuid()
const expectedCaseId = "41BP0510007"
const originalXml = formatXml(`
  <?xml version="1.0" encoding="UTF-8"?>
  <RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <RequestFromSystem>
      <CorrelationID>
        ${expectedExternalCorrelationId}
      </CorrelationID>
    </RequestFromSystem>
    <DataStream>
      <DataStreamContent>
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

const AWS_URL = "http://localhost:4566"
const REGION = "us-east-1"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: AWS_URL,
  DYNAMO_REGION: REGION,
  AUDIT_LOG_TABLE_NAME: "audit-log"
}
const dynamoGateway = new TestDynamoGateway(dynamoConfig)

const s3Gateway = new TestS3Gateway({
  url: AWS_URL,
  region: REGION,
  bucketName: "incoming-messages"
})

const simulator = new IncomingMessageSimulator(AWS_URL)

const queueName = "INCOMING_MESSAGE_HANDLER_QUEUE"
const testMqGateway = new TestMqGateway({
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin",
  queueName
})

describe("e2e tests", () => {
  beforeEach(async () => {
    await dynamoGateway.deleteAll(dynamoConfig.AUDIT_LOG_TABLE_NAME, "messageId")
    await s3Gateway.deleteAll()
  })

  afterAll(async () => {
    await testMqGateway.dispose()
  })

  it("should receive a message on the target queue when the message is sent to the S3 bucket", async () => {
    const fileName = `2021/03/15/12/28/${expectedExternalCorrelationId}.xml`
    const expectedReceivedDate = new Date(2021, 2 /* March */, 15, 12, 28)

    await simulator.start(fileName, originalXml)

    // Get messages from the API
    const api = new TestApi()
    const persistedMessages = await api.pollForGetMessages()
    expect(persistedMessages).toHaveLength(1)

    const persistedMessage = persistedMessages[0]
    expect(persistedMessage.externalCorrelationId).toBe(expectedExternalCorrelationId)
    expect(persistedMessage.caseId).toBe(expectedCaseId)

    // Received date will be a string as we currently pull it straight from the database without parsing
    expect(persistedMessage.receivedDate).toBe(expectedReceivedDate.toISOString())

    expect(persistedMessage.events).toBeDefined()
    expect(persistedMessage.events).toHaveLength(1)

    const persistedEvent = persistedMessage.events[0]
    expect(persistedEvent.category).toBe("information")
    expect(persistedEvent.eventType).toBe("Message Sent to Bichard")
    expect(persistedEvent.eventSource).toBe("Incoming Message Handler")

    const actualMessage = await testMqGateway.getMessage(queueName)
    expect(isError(actualMessage)).toBe(false)

    const expectedXml = formatXml(replaceMessageIdInXml(persistedMessage))
    expect(formatXml(<string>actualMessage)).toBe(expectedXml)
  })
})
