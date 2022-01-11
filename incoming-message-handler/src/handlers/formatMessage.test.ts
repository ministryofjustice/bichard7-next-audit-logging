jest.mock("uuid")
import { hasRootElement } from "shared"
import type { ReceivedMessage } from "../entities"
import { v4 } from "uuid"
import formatMessage from "./formatMessage"

const unformattedMessageWithoutRouteData = `
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

const formattedMessageWithoutRouteData = `
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

const formattedMessageWithRouteData = `
<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/common/operations" xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities" xmlns:cjseType="http://schemas.cjse.gov.uk/common/businesstypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" VersionNumber="1.0" RequestResponse="Request">
  <RequestFromSystem VersionNumber="1.0">
    <CorrelationID>
      1234
    </CorrelationID>
  </RequestFromSystem>
  <DataStream VersionNumber="1.0">
    <DataStreamContent>${formattedMessageWithoutRouteData}</DataStreamContent>
	</DataStream>
</RouteData>
`

describe("formatMessage()", () => {
  const mockedUuidV4 = v4 as jest.MockedFunction<typeof v4>
  mockedUuidV4.mockReturnValue("1234")

  it("should not format the message when it is already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      s3Path: "path",
      externalId: "extId",
      stepExecutionId: "stepId",
      receivedDate: new Date().toISOString(),
      messageXml: formattedMessageWithRouteData
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toMatchSnapshot()
  })

  it("should format the message when it is not already formatted", async () => {
    const expectedMessage: ReceivedMessage = {
      s3Path: "path",
      externalId: "extId",
      stepExecutionId: "stepId",
      receivedDate: new Date().toISOString(),
      messageXml: unformattedMessageWithoutRouteData
    }

    const actualMessage = await formatMessage(expectedMessage)

    expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    expect(actualMessage.messageXml).toMatchSnapshot()

    const isFormatted = await hasRootElement(actualMessage.messageXml, "RouteData")
    expect(isFormatted).toBe(true)
  })
})
