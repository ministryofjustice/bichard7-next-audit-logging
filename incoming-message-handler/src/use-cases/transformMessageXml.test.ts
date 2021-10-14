import { AuditLog } from "shared"
import transformMessageXml from "./transformMessageXml"

const messageXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <RequestFromSystem>
        <CorrelationID>
          EXTERNAL_CORRELATION_ID
        </CorrelationID>
      </RequestFromSystem>
      <DataStream>
        <DataStreamContent>
          <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g">
            <DC:Session>
              <DC:Case>
                <DC:PTIURN>
                  CASE_ID
                </DC:PTIURN>
              </DC:Case>
            </DC:Session>
          </DC:ResultedCaseMessage>
        </DataStreamContent>
      </DataStream>
    </RouteData>
`
const auditLog = {
  ...new AuditLog("EXTERNAL_CORRELATION_ID", new Date("2021-10-13T10:12:13"), messageXml),
  messageId: "MESSAGE_ID"
}

describe("formatMessageXml()", () => {
  it("should format the message", () => {
    const formattedMessage = transformMessageXml(auditLog)

    expect(formattedMessage).toMatchSnapshot()
  })
})
