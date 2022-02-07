import "shared-testing"
import type { ReceivedMessage } from "../entities"
import formatMessage from "./formatMessage"

const message = `
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

it("should format the message XML when the message XML is correct", async () => {
  const receivedMessage = {
    s3Path: "DUMMY_KEY",
    receivedDate: "DUMMY_DATE",
    externalId: "DUMMY_EXTERNALID",
    stepExecutionId: "DUMMY_EXECUTION_ID",
    messageXml: message
  } as ReceivedMessage
  const result = await formatMessage(receivedMessage)

  expect(result).toNotBeError()

  const { messageXml, s3Path, stepExecutionId, externalId, receivedDate } = result as ReceivedMessage
  expect(s3Path).toBe(receivedMessage.s3Path)
  expect(stepExecutionId).toBe(receivedMessage.stepExecutionId)
  expect(externalId).toBe(receivedMessage.externalId)
  expect(receivedDate).toBe(receivedMessage.receivedDate)
  expect(messageXml).toMatchSnapshot()
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
