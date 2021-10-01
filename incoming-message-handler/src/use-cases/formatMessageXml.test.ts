import { parseXml } from "shared"
import type { DeliveryMessage } from "src/entities"
import formatMessageXml from "./formatMessageXml"

const message = `
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

describe("formatMessageXml()", () => {
  let xml: DeliveryMessage
  beforeAll(async () => {
    const formattedMessage = formatMessageXml(message)
    xml = await parseXml<DeliveryMessage>(formattedMessage)
  })

  it("should format the message", () => {
    expect(xml.RouteData).toBeDefined()
  })

  it("should provide a message id", () => {
    expect(xml.RouteData.RequestFromSystem.CorrelationID).toBeDefined()
  })

  it("should provide a case id", () => {
    expect(xml.RouteData.DataStream.DataStreamContent.ResultedCaseMessage.Session.Case.PTIURN).toBe("123456789")
  })
})
