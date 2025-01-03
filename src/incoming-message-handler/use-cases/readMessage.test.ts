import { randomUUID } from "crypto"
import type { ApplicationError, InputApiAuditLog } from "src/shared/types"
import { isError } from "src/shared/types"
import format from "xml-formatter"
import type { ReceivedMessage } from "../entities"
import readMessage from "./readMessage"

const formatXml = (xml: string): string =>
  format(xml, {
    indentation: "  "
  })

const expectedExternalCorrelationId = randomUUID()
const expectedCaseId = "41BP0510007"
const expectedSystemId = "DUMMY_SYSTEM_ID"
const expectedMessage = formatXml(`
<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <RequestFromSystem>
    <CorrelationID>
      ${expectedExternalCorrelationId}
    </CorrelationID>
  </RequestFromSystem>
	<DataStream>
    <System>
      ${expectedSystemId}
    </System>
    <DataStreamContent>
      <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        <DC:Session>
          <DC:Case>
            <DC:PTIURN>
              ${expectedCaseId}
            </DC:PTIURN>
          </DC:Case>
        </DC:Session>
      </DC:ResultedCaseMessage>
    </DataStreamContent>
	</DataStream>
</RouteData>
`)

const expectedMessageWithoutSystemId = formatXml(`
<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <RequestFromSystem>
    <CorrelationID>
      ${expectedExternalCorrelationId}
    </CorrelationID>
  </RequestFromSystem>
	<DataStream>
    <DataStreamContent>
      <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        <DC:Session>
          <DC:Case>
            <DC:PTIURN>
              ${expectedCaseId}
            </DC:PTIURN>
          </DC:Case>
        </DC:Session>
      </DC:ResultedCaseMessage>
    </DataStreamContent>
	</DataStream>
</RouteData>
`)

const message: ReceivedMessage = {
  s3Path: "path",
  externalId: "extId",
  stepExecutionId: "stepId",
  receivedDate: new Date().toISOString(),
  messageXml: "",
  hash: "dummy hash"
}

describe("handleMessage", () => {
  it("should read the message and return the message data", async () => {
    message.messageXml = expectedMessage

    const result = (await readMessage(message)) as InputApiAuditLog
    const { messageId, externalCorrelationId, caseId, systemId, createdBy } = result

    expect(messageId).toBeDefined()
    expect(externalCorrelationId).toBe(expectedExternalCorrelationId)
    expect(caseId).toEqual(expectedCaseId)
    expect(systemId).toEqual(expectedSystemId)
    expect(createdBy).toBe("Incoming message handler")
  })

  it("should read the message and return the message data when system ID does not exist", async () => {
    message.messageXml = expectedMessageWithoutSystemId

    const result = (await readMessage(message)) as InputApiAuditLog
    const { messageId, externalCorrelationId, caseId, systemId, createdBy } = result

    expect(messageId).toBeDefined()
    expect(externalCorrelationId).toBe(expectedExternalCorrelationId)
    expect(caseId).toEqual(expectedCaseId)
    expect(systemId).toBeUndefined()
    expect(createdBy).toBe("Incoming message handler")
  })

  it("should handle invalid xml", async () => {
    message.messageXml = "Invalid xml"

    const result = await readMessage(message)

    const applicationError = <ApplicationError>result
    expect(isError(result)).toBe(true)
    expect(applicationError.message).toBe("Failed to parse XML")
    expect(applicationError.originalError).toBeDefined()
  })

  it("should handle missing message id error", async () => {
    message.messageXml = expectedMessage.replace(/<CorrelationID>.+?<\/CorrelationID>/s, "")

    const result = await readMessage(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe("The External Correlation Id cannot be found")
  })

  it("should handle missing case id error", async () => {
    message.messageXml = expectedMessage.replace(/<DC:PTIURN>.+?<\/DC:PTIURN>/s, "")

    const result = await readMessage(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe("Case Id cannot be found")
  })

  it("should handle missing missing message hash error", async () => {
    message.messageXml = expectedMessage.replace(/<DC:PTIURN>.+?<\/DC:PTIURN>/s, "")
    const messageWithoutHash = { ...message }
    delete messageWithoutHash.hash

    const result = await readMessage(messageWithoutHash)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe("Message hash is mandatory.")
  })
})
