import { v4 as uuid } from "uuid"
import { isError } from "@handlers/common"
import HandleMessageUseCase from "./HandleMessageUseCase"
import { IncomingMessage } from "../entities"

const partialMessage = `
<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
	<DC:Session>
		<DC:Case>
			<DC:PTIURN>41BP0510007</DC:PTIURN>
		</DC:Case>
	</DC:Session>
</DC:ResultedCaseMessage>
`

const expectedMessageId = uuid()
const message = `
<?xml version="1.0" encoding="UTF-8"?>
<DeliverRequest xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<msg:MessageIdentifier>${expectedMessageId}</msg:MessageIdentifier>
	<Message>
		${partialMessage}
	</Message>
</DeliverRequest>
`

const useCase = new HandleMessageUseCase()

describe("HandleMessageUseCase", () => {
  describe("handle()", () => {
    it("should return undefined when the message was handled successfully", async () => {
      const result = await useCase.handle(message)

      expect(isError(result)).toBe(false)

      const incomingMessage = <IncomingMessage>result
      expect(incomingMessage.messageId).toBe(expectedMessageId)
      expect(incomingMessage.messageXml).toBe(message)
    })

    it("should return an error when reading the message fails", async () => {
      const result = await useCase.handle("<InvalidMessage />")

      expect(isError(result)).toBe(true)
    })
  })
})
