import { MessageData } from "src/types"
import { isError, PromiseResult, Result } from "@handlers/common"
import DeliveryMessage from "src/entities/DeliveryMessage"
import { parseXml } from "../utils/xml"
import ApplicationError from "../errors/ApplicationError"

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

  return messageId
}

const readMessage = async (message: string): PromiseResult<MessageData> => {
  const xml = await parseXml<DeliveryMessage>(message).catch((err) => <Error>err)

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

  const messageData: MessageData = {
    messageId,
    caseId,
    rawXml: message
  }

  return messageData
}

export default readMessage
