import { parseXml } from "src/shared"
import type { PromiseResult, Result } from "src/shared/types"
import { ApplicationError, AuditLog, isError } from "src/shared/types"
import type { DeliveryMessage, ReceivedMessage } from "../entities"

const getCaseId = (xml: DeliveryMessage): Result<string> => {
  const caseId =
    xml.RouteData &&
    xml.RouteData.DataStream &&
    xml.RouteData.DataStream.DataStreamContent &&
    xml.RouteData.DataStream.DataStreamContent.ResultedCaseMessage &&
    xml.RouteData.DataStream.DataStreamContent.ResultedCaseMessage.Session &&
    xml.RouteData.DataStream.DataStreamContent.ResultedCaseMessage.Session.Case &&
    xml.RouteData.DataStream.DataStreamContent.ResultedCaseMessage.Session.Case.PTIURN

  if (!caseId) {
    return new Error("Case Id cannot be found")
  }

  return caseId.trim()
}

const getExternalCorrelationId = (xml: DeliveryMessage): Result<string> => {
  const externalCorrelationId =
    xml.RouteData && xml.RouteData.RequestFromSystem && xml.RouteData.RequestFromSystem.CorrelationID

  if (!externalCorrelationId) {
    return new Error("The External Correlation Id cannot be found")
  }

  return externalCorrelationId.trim()
}

const readMessage = async (message: ReceivedMessage): PromiseResult<AuditLog> => {
  if (!message.hash) {
    return Error("Message hash is mandatory.")
  }

  const xml = await parseXml<DeliveryMessage>(message.messageXml).catch((error: Error) => error)

  if (isError(xml)) {
    return new ApplicationError("Failed to parse XML", xml)
  }

  const externalCorrelationId = getExternalCorrelationId(xml)
  if (isError(externalCorrelationId)) {
    return externalCorrelationId
  }

  const caseId = getCaseId(xml)
  if (isError(caseId)) {
    return caseId
  }

  const auditLog = new AuditLog(externalCorrelationId, new Date(message.receivedDate), message.hash)
  auditLog.caseId = caseId
  auditLog.systemId = xml.RouteData?.DataStream?.System?.trim()
  auditLog.createdBy = "Incoming message handler"
  auditLog.s3Path = message.s3Path
  auditLog.externalId = message.externalId
  auditLog.stepExecutionId = message.stepExecutionId

  return auditLog
}

export default readMessage