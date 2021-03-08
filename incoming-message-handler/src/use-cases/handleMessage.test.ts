import { MessageData } from "src/types"
import handleMessage from "./handleMessage"

const partialMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	<DC:Session>
		<DC:Case>
			<DC:PTIURN>41BP0510007</DC:PTIURN>
		</DC:Case>
	</DC:Session>
</DC:ResultedCaseMessage>
`
const message = `
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>http://www.altova.com</msg:MessageIdentifier>
	<Message>
		${partialMessage}
	</Message>
</DeliverRequest>
`

describe("handleMessage", () => {
  it("should return the message data", async () => {
    const result = (await handleMessage(message)) as MessageData
    const { messageId, caseId, rawXml } = result

    expect(messageId).toBeDefined()
    expect(rawXml).toBeDefined()
    expect(caseId).toEqual("41BP0510007")
  })

  it("should handle partial message and return the message data", async () => {
    const result = (await handleMessage(partialMessage)) as MessageData
    const { messageId, caseId, rawXml } = result

    expect(messageId).toBeDefined()
    expect(rawXml).toBeDefined()
    expect(caseId).toEqual("41BP0510007")
  })
})
