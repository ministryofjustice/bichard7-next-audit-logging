import { AuditLog, isError, PromiseResult, Result } from "shared"
import { DeliveryMessage, ReceivedMessage } from "src/entities"
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

const readMessage = async (message: ReceivedMessage): PromiseResult<AuditLog> => {
  const xml = await parseXml<DeliveryMessage>(message.messageXml).catch((error: Error) => error)

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

  const auditLog = new AuditLog(messageId, message.receivedDate, message.messageXml)
  auditLog.caseId = caseId

  return auditLog
}

export default readMessage
