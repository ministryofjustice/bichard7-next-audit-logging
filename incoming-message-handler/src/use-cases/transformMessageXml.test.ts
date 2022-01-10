import { AuditLog } from "shared-types"
import transformMessageXml from "./transformMessageXml"

const createAuditLog = (xml: string) => ({
  ...new AuditLog("EXTERNAL_CORRELATION_ID", new Date("2021-10-13T10:12:13"), xml),
  messageId: "MESSAGE_ID"
})

describe("formatMessageXml()", () => {
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
  it("should format the message", () => {
    const formattedMessage = transformMessageXml(createAuditLog(messageXml))

    expect(formattedMessage).toMatchSnapshot()
  })

  const namespacedMessageXml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <cjseOps:RouteData xmlns:cjseOps="http://schemas.cjse.gov.uk/common/operations" VersionNumber="1.0" RequestResponse="Request">
    <cjseOps:RequestFromSystem VersionNumber="1.0">
      <cjseOps:CorrelationID>
        EXTERNAL_CORRELATION_ID
      </cjseOps:CorrelationID>
    </cjseOps:RequestFromSystem>
    <cjseOps:DataStream VersionNumber="1.0">
      <cjseEntity:DataStreamContent xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities">
        <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g">
          <DC:Session>
            <DC:Case>
              <DC:PTIURN>
                CASE_ID
              </DC:PTIURN>
            </DC:Case>
          </DC:Session>
        </DC:ResultedCaseMessage>
      </cjseEntity:DataStreamContent>
    </cjseOps:DataStream>
  </cjseOps:RouteData>
`
  it("should format the message with namespaced xml", () => {
    const formattedMessage = transformMessageXml(createAuditLog(namespacedMessageXml))

    expect(formattedMessage).toMatchSnapshot()
  })

  const escapedMessageXml = `
<?xml version="1.0" encoding="UTF-8"?>
<cjseOps:RouteData xmlns:cjseOps="http://schemas.cjse.gov.uk/common/operations" VersionNumber="1.0" RequestResponse="Request">
  <cjseOps:RequestFromSystem VersionNumber="1.0">
    <cjseOps:CorrelationID>
      EXTERNAL_CORRELATION_ID
    </cjseOps:CorrelationID>
  </cjseOps:RequestFromSystem>
  <cjseOps:DataStream VersionNumber="1.0">
    <cjseEntity:DataStreamContent xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities">
      &lt;DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g"&gt;
        &lt;DC:Session&gt;
          &lt;DC:Case&gt;
            &lt;DC:PTIURN&gt;
              CASE_ID
            &lt;/DC:PTIURN&gt;
          &lt;/DC:Case&gt;
        &lt;/DC:Session&gt;
      &lt;/DC:ResultedCaseMessage&gt;
    </cjseEntity:DataStreamContent>
  </cjseOps:DataStream>
</cjseOps:RouteData>
`

  it("should format the message with escaped xml", () => {
    const formattedMessage = transformMessageXml(createAuditLog(escapedMessageXml))

    expect(formattedMessage).toMatchSnapshot()
  })

  const escapedPrologMessageXml = `
<?xml version="1.0" encoding="UTF-8"?>
<cjseOps:RouteData xmlns:cjseOps="http://schemas.cjse.gov.uk/common/operations" VersionNumber="1.0" RequestResponse="Request">
  <cjseOps:RequestFromSystem VersionNumber="1.0">
    <cjseOps:CorrelationID>
      EXTERNAL_CORRELATION_ID
    </cjseOps:CorrelationID>
  </cjseOps:RequestFromSystem>
  <cjseOps:DataStream VersionNumber="1.0">
    <cjseEntity:DataStreamContent xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities">
      &lt;?xml version="1.0" encoding="UTF-8"?&gt;
      &lt;DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g"&gt;
        &lt;DC:Session&gt;
          &lt;DC:Case&gt;
            &lt;DC:PTIURN&gt;
              CASE_ID
            &lt;/DC:PTIURN&gt;
          &lt;/DC:Case&gt;
        &lt;/DC:Session&gt;
      &lt;/DC:ResultedCaseMessage&gt;
    </cjseEntity:DataStreamContent>
  </cjseOps:DataStream>
</cjseOps:RouteData>
`

  it("should format the message with escaped xml with a prolog", () => {
    const formattedMessage = transformMessageXml(createAuditLog(escapedPrologMessageXml))

    expect(formattedMessage).toMatchSnapshot()
  })
})
