jest.mock("uuid")
import { v4 as uuidv4 } from "uuid"
import "shared-testing"
import type { ReceivedMessage } from "../entities"
import formatMessage from "./formatMessage"

const unwrappedMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	&lt;DC:Session&gt;
		<DC:Case>
			<DC:PTIURN>
        123456789
      </DC:PTIURN>
		</DC:Case>
	&lt;/DC:Session&gt;
</DC:ResultedCaseMessage>
`
const getWrappedMessage = (correlationId?: string) => `<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/common/operations" xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities" xmlns:cjseType="http://schemas.cjse.gov.uk/common/businesstypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" VersionNumber="1.0" RequestResponse="Request">
  <RequestFromSystem VersionNumber="1.0">
    <CorrelationID>${correlationId ?? uuidv4()}</CorrelationID>
  </RequestFromSystem>
  <DataStream VersionNumber="1.0">
    <DataStreamContent>${unwrappedMessage}</DataStreamContent>
  </DataStream>
</RouteData>`

it("should format the message XML when the message XML is correct", async () => {
  const receivedMessage = {
    s3Path: "DUMMY_KEY",
    receivedDate: "DUMMY_DATE",
    externalId: "DUMMY_EXTERNALID",
    stepExecutionId: "DUMMY_EXECUTION_ID",
    messageXml: unwrappedMessage
  } as ReceivedMessage
  const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
  mockedUuidV4.mockReturnValue("MESSAGE_ID")
  const result = await formatMessage(receivedMessage)

  expect(result).toNotBeError()

  const { messageXml, s3Path, stepExecutionId, externalId, receivedDate, hash } = result as ReceivedMessage
  expect(s3Path).toBe(receivedMessage.s3Path)
  expect(stepExecutionId).toBe(receivedMessage.stepExecutionId)
  expect(externalId).toBe(receivedMessage.externalId)
  expect(receivedDate).toBe(receivedMessage.receivedDate)
  expect(hash).toBe("44596f3b496f4aa616db7ede7055fab81138ea043e255c25071b3948a66345a2")
  expect(messageXml).toMatchSnapshot()
})

it("should have the same hash for both wrapped and unwrapped messages", async () => {
  const unwrappedReceivedMessage = {
    s3Path: "DUMMY_KEY_1",
    receivedDate: "DUMMY_DATE_1",
    externalId: "DUMMY_EXTERNALID_1",
    stepExecutionId: "DUMMY_EXECUTION_ID_1",
    messageXml: unwrappedMessage
  } as ReceivedMessage
  const wrappedReceivedMessage = {
    s3Path: "DUMMY_KEY_2",
    receivedDate: "DUMMY_DATE_2",
    externalId: "DUMMY_EXTERNALID_2",
    stepExecutionId: "DUMMY_EXECUTION_ID_2",
    messageXml: getWrappedMessage()
  } as ReceivedMessage
  const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
  mockedUuidV4.mockReturnValue("MESSAGE_ID")
  const resultForWrappedMessage = await formatMessage(wrappedReceivedMessage)
  const resultForUnwrappedMessage = await formatMessage(unwrappedReceivedMessage)

  expect(resultForWrappedMessage).toNotBeError()
  expect(resultForUnwrappedMessage).toNotBeError()

  const { hash: hashForUnwrappedMessage } = resultForUnwrappedMessage as ReceivedMessage
  const { hash: hashForWrappedMessage } = resultForWrappedMessage as ReceivedMessage
  expect(hashForUnwrappedMessage).toBe(hashForWrappedMessage)
})

it("should generate the same hash for the same wrapped messages with different correlation ID", async () => {
  const messageXml1 = getWrappedMessage("ID 1")
  const messageXml2 = getWrappedMessage("ID 2")
  const wrappedReceivedMessage1 = {
    s3Path: "DUMMY_KEY_2",
    receivedDate: "DUMMY_DATE_2",
    externalId: "DUMMY_EXTERNALID_2",
    stepExecutionId: "DUMMY_EXECUTION_ID_2",
    messageXml: messageXml1
  } as ReceivedMessage
  const wrappedReceivedMessage2 = {
    s3Path: "DUMMY_KEY_2",
    receivedDate: "DUMMY_DATE_2",
    externalId: "DUMMY_EXTERNALID_2",
    stepExecutionId: "DUMMY_EXECUTION_ID_2",
    messageXml: messageXml2
  } as ReceivedMessage

  const result1 = await formatMessage(wrappedReceivedMessage1)
  const result2 = await formatMessage(wrappedReceivedMessage2)

  expect(wrappedReceivedMessage1.messageXml).not.toBe(wrappedReceivedMessage2.messageXml)

  expect(result1).toNotBeError()
  expect(result2).toNotBeError()

  const { hash: hash1 } = result1 as ReceivedMessage
  const { hash: hash2 } = result2 as ReceivedMessage
  expect(hash1).toBe(hash2)
})

it("should return error when message XML is incorrect", async () => {
  const receivedMessage = {
    s3Path: "DUMMY_KEY",
    receivedDate: "DUMMY_DATE",
    externalId: "DUMMY_EXTERNALID",
    stepExecutionId: "DUMMY_EXECUTION_ID",
    messageXml: "INCORRECT_XML"
  } as ReceivedMessage
  const result = await formatMessage(receivedMessage)

  expect(result).toBeError("Error while formatting the message")
})
