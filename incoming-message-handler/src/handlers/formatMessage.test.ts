import { ReceivedMessage } from "src/entities"
import { hasRootElement } from "src/utils/xml"
import formatMessage from "./formatMessage"

const unformattedMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	<DC:Session>
		<DC:Case>
			<DC:PTIURN>
        123456789
      </DC:PTIURN>
		</DC:Case>
	</DC:Session>
</DC:ResultedCaseMessage>
`

const formattedMessage = `
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>1234</msg:MessageIdentifier>
	<Message>
    ${unformattedMessage}
	</Message>
</DeliverRequest>
`

describe("formatMessage()", () => {
  it("should not format the message when it is already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      receivedDate: new Date(),
      messageXml: formattedMessage
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toBe(expectedMessage.messageXml)
  })

  it("should format the message when it is not already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      receivedDate: new Date(),
      messageXml: unformattedMessage
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toContain(unformattedMessage)

    const isFormatted = await hasRootElement(actualMessage.messageXml, "DeliverRequest")
    expect(isFormatted).toBe(true)
  })
})
