import DeliveryMessage from "src/entities/DeliveryMessage"
import { parseXml } from "../utils/xml"
import formatMessage from "./formatMessage"

const message = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	<DC:Session>
		<DC:Case>
			<DC:PTIURN>123456789</DC:PTIURN>
		</DC:Case>
	</DC:Session>
</DC:ResultedCaseMessage>
`

describe("formatMessage", () => {
  let xml: DeliveryMessage
  beforeAll(async () => {
    const formattedMessage = formatMessage(message)
    xml = await parseXml<DeliveryMessage>(formattedMessage)
  })

  it("should format the message", async () => {
    expect(xml.DeliverRequest).toBeDefined()
  })

  it("should provide a message id", async () => {
    expect(xml.DeliverRequest.MessageIdentifier).toBeDefined()
  })

  it("should provide a case id", async () => {
    expect(xml.DeliverRequest.Message.ResultedCaseMessage.Session.Case.PTIURN).toBe("123456789")
  })
})
