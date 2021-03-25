import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import { isError, AuditLog } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import TestS3Gateway from "src/gateways/S3Gateway/TestS3Gateway"
import IncomingMessageSimulator from "./IncomingMessageSimulator"
import IbmMqService from "./IbmMqService"

jest.setTimeout(30000)

const formatXml = (xml: string): string => format(xml, { indentation: "  " })

const expectedMessageId = uuid()
const expectedCaseId = "41BP0510007"
const expectedMessage = formatXml(
  `
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>${expectedMessageId}</msg:MessageIdentifier>
	<Message>
    <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g">
      <DC:Session>
        <DC:Case>
          <DC:PTIURN>
            ${expectedCaseId}
          </DC:PTIURN>
        </DC:Case>
      </DC:Session>
    </DC:ResultedCaseMessage>
	</Message>
</DeliverRequest>
`
)

const AWS_URL = "http://localhost:4566"
const REGION = "us-east-1"

const dynamoGateway = new TestDynamoGateway({
  DYNAMO_URL: AWS_URL,
  DYNAMO_REGION: REGION
})

const s3Gateway = new TestS3Gateway({
  S3_URL: AWS_URL,
  S3_REGION: REGION,
  S3_FORCE_PATH_STYLE: "true",
  INCOMING_MESSAGE_BUCKET_NAME: "incoming-messages"
})

const simulator = new IncomingMessageSimulator(AWS_URL)

const mq = new IbmMqService({
  MQ_HOST: "localhost",
  MQ_PORT: "10443",
  MQ_QUEUE_MANAGER: "BR7_QM",
  MQ_QUEUE: "DEV.QUEUE.1",
  MQ_USER: "app",
  MQ_PASSWORD: "passw0rd"
})

describe("e2e tests", () => {
  beforeEach(async () => {
    await mq.clearQueue()
    await dynamoGateway.deleteAll("audit-log", "messageId")
    await s3Gateway.deleteAll()
  })

  it("should receive a message on the target queue when the message is sent to the S3 bucket", async () => {
    const fileName = `2021/03/15/12/28/${expectedMessageId}.xml`
    const expectedReceivedDate = new Date(2021, 2 /* March */, 15, 12, 28)

    await simulator.start(fileName, expectedMessage)

    // Check the message is in the database
    const persistedMessages = await dynamoGateway.pollForMessages("audit-log", 3000)
    expect(persistedMessages.Count).toBe(1)

    const persistedMessage = <AuditLog>persistedMessages.Items[0]
    expect(persistedMessage.messageId).toBe(expectedMessageId)
    expect(persistedMessage.caseId).toBe(expectedCaseId)

    // Received date will be a string as we currently pull it straight from the database without parsing
    expect(persistedMessage.receivedDate).toBe(expectedReceivedDate.toISOString())

    const actualMessage = await mq.pollForMessage(3000)
    expect(isError(actualMessage)).toBe(false)
    expect(formatXml(<string>actualMessage)).toBe(expectedMessage)
  })
})
