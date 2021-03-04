import { SQSRecord } from "aws-lambda"
import { MessageData } from "src/types"
import FormattMessageUseCase from "./FormatMessageUseCase"

const partialMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	<DC:Session>
		<DC:Case>
			<DC:PTIURN>41BP0510007</DC:PTIURN>
		</DC:Case>
	</DC:Session>
</DC:ResultedCaseMessage>
`
const fullMessage = `
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>http://www.altova.com</msg:MessageIdentifier>
	<Message>
		<DC:ResultedCaseMessage xmlns:DC='http://www.dca.gov.uk/xmlschemas/libra' Flow='ResultedCasesForThePolice'
			Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
			<DC:Session>
				<DC:Case>
					<DC:PTIURN>41BP0510007</DC:PTIURN>
				</DC:Case>
			</DC:Session>
		</DC:ResultedCaseMessage>
	</Message>
</DeliverRequest>
`
describe("FormatMessageUseCase", () => {
  it("should  return the metadata", async () => {
    const useCase = new FormattMessageUseCase({ AWS_SHOULD_FORMAT_MESSAGE: false })
    const result = await useCase.get([{ body: fullMessage }] as SQSRecord[])
    const success = result.filter((r) => r.status === "fulfilled")[0] as PromiseFulfilledResult<MessageData>
    const { messageId, ptiurn, rawXml } = success.value
    expect(messageId).toBeDefined()
    expect(rawXml).toBeDefined()
    expect(ptiurn).toEqual("41BP0510007")
  })

  it("should format the message only and return the metadata", async () => {
    const useCase = new FormattMessageUseCase({ AWS_SHOULD_FORMAT_MESSAGE: true })
    const result = await useCase.get([{ body: partialMessage }] as SQSRecord[])
    const success = result.filter((r) => r.status === "fulfilled")[0] as PromiseFulfilledResult<MessageData>
    const { messageId, ptiurn, rawXml } = success.value
    expect(messageId).toBeDefined()
    expect(rawXml).toBeDefined()
    expect(ptiurn).toEqual("41BP0510007")
  })

  it("should fail to format the message", async () => {
    const useCase = new FormattMessageUseCase({ AWS_SHOULD_FORMAT_MESSAGE: true })
    const result = await useCase.get([{ body: "Invalid XML" }] as SQSRecord[])
    const failed = result.filter((r) => r.status === "rejected") as PromiseRejectedResult[]
    expect(failed.length).toBe(1)
  })
})
