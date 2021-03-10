import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import { isError } from "@handlers/common"
import ApplicationError from "../errors/ApplicationError"
import { MessageData } from "../types"
import readMessage from "./readMessage"

const formatXml = (xml: string): string =>
  format(xml, {
    indentation: "  "
  })

const expectedMessageId = uuid()
const expectedCaseId = "41BP0510007"
const expectedMessage = formatXml(`
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>
    ${expectedMessageId}
  </msg:MessageIdentifier>
	<Message>
    <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
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
`)

describe("handleMessage", () => {
  it("should read the message and return the message data", async () => {
    const result = (await readMessage(expectedMessage)) as MessageData
    const { messageId, caseId, rawXml } = result

    expect(messageId).toBe(expectedMessageId)
    expect(rawXml).toBe(expectedMessage)
    expect(caseId).toEqual(expectedCaseId)
  })

  it("should handle invalid xml", async () => {
    const result = await readMessage("Invalid xml")

    const applicationError = <ApplicationError>result
    expect(isError(result)).toBe(true)
    expect(applicationError.message).toEqual("Failed to parse XML")
    expect(applicationError.originalError).toBeDefined()
  })

  it("should handle missing message id error", async () => {
    const messageWithNoId = expectedMessage.replace(/<msg:MessageIdentifier>.+?<\/msg:MessageIdentifier>/s, "")
    const result = await readMessage(messageWithNoId)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toEqual("Message Id cannot be found")
  })

  it("should handle missing case id error", async () => {
    const messageWithNoCaseId = expectedMessage.replace(/<DC:PTIURN>.+?<\/DC:PTIURN>/s, "")
    const result = await readMessage(messageWithNoCaseId)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toEqual("Case Id cannot be found")
  })
})
