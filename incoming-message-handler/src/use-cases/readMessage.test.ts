import { v4 as uuid } from "uuid"
import format from "xml-formatter"
import type { AuditLog } from "shared"
import { isError } from "shared"
import type ApplicationError from "src/errors/ApplicationError"
import type { ReceivedMessage } from "src/entities"
import readMessage from "./readMessage"

const formatXml = (xml: string): string =>
  format(xml, {
    indentation: "  "
  })

const expectedExternalCorrelationId = uuid()
const expectedCaseId = "41BP0510007"
const expectedMessage = formatXml(`
<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <RequestFromSystem>
    <CorrelationID>
      ${expectedExternalCorrelationId}
    </CorrelationID>
  </RequestFromSystem>
	<DataStream>
    <DataStreamContent>
      <ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        <Session>
          <Case>
            <PTIURN>
              ${expectedCaseId}
            </PTIURN>
          </Case>
        </Session>
      </ResultedCaseMessage>
    </DataStreamContent>
	</DataStream>
</RouteData>
`)

const message: ReceivedMessage = {
  receivedDate: new Date().toISOString(),
  messageXml: ""
}

describe("handleMessage", () => {
  it("should read the message and return the message data", async () => {
    message.messageXml = expectedMessage

    const result = (await readMessage(message)) as AuditLog
    const { messageId, externalCorrelationId, caseId, messageXml } = result

    expect(messageId).toBeDefined()
    expect(externalCorrelationId).toBe(expectedExternalCorrelationId)
    expect(messageXml).toBe(expectedMessage)
    expect(caseId).toEqual(expectedCaseId)
  })

  it("should handle invalid xml", async () => {
    message.messageXml = "Invalid xml"

    const result = await readMessage(message)

    const applicationError = <ApplicationError>result
    expect(isError(result)).toBe(true)
    expect(applicationError.message).toEqual("Failed to parse XML")
    expect(applicationError.originalError).toBeDefined()
  })

  it("should handle missing message id error", async () => {
    message.messageXml = expectedMessage.replace(/<CorrelationID>.+?<\/CorrelationID>/s, "")

    const result = await readMessage(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toEqual("The External Correlation Id cannot be found")
  })

  it("should handle missing case id error", async () => {
    message.messageXml = expectedMessage.replace(/<PTIURN>.+?<\/PTIURN>/s, "")

    const result = await readMessage(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toEqual("Case Id cannot be found")
  })
})
