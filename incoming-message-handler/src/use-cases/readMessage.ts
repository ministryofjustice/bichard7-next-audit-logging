import { isError, PromiseResult, Result } from "@handlers/common"
import { DeliveryMessage, IncomingMessage, ReceivedMessage } from "src/entities"
import { parseXml } from "src/utils/xml"
import ApplicationError from "src/errors/ApplicationError"

const getCaseId = (xml: DeliveryMessage): Result<string> => {
  const caseId =
    xml.DeliverRequest &&
    xml.DeliverRequest.Message &&
    xml.DeliverRequest.Message.ResultedCaseMessage &&
    xml.DeliverRequest.Message.ResultedCaseMessage.Session &&
    xml.DeliverRequest.Message.ResultedCaseMessage.Session.Case &&
    xml.DeliverRequest.Message.ResultedCaseMessage.Session.Case.PTIURN

  if (!caseId) {
    return new Error("Case Id cannot be found")
  }

  return caseId
}

const getMessageId = (xml: DeliveryMessage): Result<string> => {
  const messageId = xml.DeliverRequest && xml.DeliverRequest.MessageIdentifier

  if (!messageId) {
    return new Error("Message Id cannot be found")
  }

  return messageId.trim()
}

const readMessage = async (message: ReceivedMessage): PromiseResult<IncomingMessage> => {
  const xml = await parseXml<DeliveryMessage>(message.messageXml).catch((error: any) => <Error>error)

  if (isError(xml)) {
    return new ApplicationError("Failed to parse XML", xml)
  }

  const messageId = getMessageId(xml)

  if (isError(messageId)) {
    return messageId
  }

  const caseId = getCaseId(xml)

  if (isError(caseId)) {
    return caseId
  }

  const incomingMessage = new IncomingMessage(messageId, message.receivedDate, message.messageXml)
  incomingMessage.caseId = caseId

  return incomingMessage
}

export default readMessage
