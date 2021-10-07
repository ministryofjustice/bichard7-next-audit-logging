import { hasRootElement } from "shared"
import type { ReceivedMessage } from "src/entities"
import formatMessage from "./formatMessage"

const unformattedMessage = `
&lt;DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g"&gt;
  &lt;DC:Session&gt;
    &lt;DC:Case&gt;
      &lt;DC:PTIURN&gt;
        123456789
      &lt;/DC:PTIURN&gt;
    &lt;/DC:Case&gt;
  &lt;/DC:Session&gt;
&lt;/DC:ResultedCaseMessage&gt;

`

const expectedUnformattedMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g">
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
<RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <RequestFromSystem>
    <CorrelationID>
      1234
    </CorrelationID>
  </RequestFromSystem>
  <DataStream>
    <DataStreamContent>
      ${unformattedMessage}
    </DataStreamContent>
	</DataStream>
</RouteData>
`

const expectedFormattedMessage = `
<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <RequestFromSystem>
    <CorrelationID>
      1234
    </CorrelationID>
  </RequestFromSystem>
  <DataStream>
    <DataStreamContent>
      ${expectedUnformattedMessage}
    </DataStreamContent>
	</DataStream>
</RouteData>
`

describe("formatMessage()", () => {
  it("should not format the message when it is already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      receivedDate: new Date().toISOString(),
      messageXml: formattedMessage
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toBe(expectedFormattedMessage)
  })

  it("should format the message when it is not already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      receivedDate: new Date().toISOString(),
      messageXml: unformattedMessage
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toContain(expectedUnformattedMessage)

    const isFormatted = await hasRootElement(actualMessage.messageXml, "RouteData")
    expect(isFormatted).toBe(true)
  })
})
