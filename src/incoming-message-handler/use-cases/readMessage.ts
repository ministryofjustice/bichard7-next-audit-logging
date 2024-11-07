import { randomUUID } from "crypto"
import { parseXml } from "src/shared"
import type { InputApiAuditLog, PromiseResult, Result } from "src/shared/types"
import { ApplicationError, isError } from "src/shared/types"
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

const readMessage = async (message: ReceivedMessage): PromiseResult<InputApiAuditLog> => {
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

  return {
    caseId: caseId,
    createdBy: "Incoming message handler",
    externalCorrelationId,
    externalId: message.externalId,
    isSanitised: 0,
    messageHash: message.hash,
    messageId: randomUUID(),
    receivedDate: message.receivedDate,
    s3Path: message.s3Path,
    stepExecutionId: message.stepExecutionId,
    systemId: xml.RouteData?.DataStream?.System?.trim()
  }
}

export default readMessage
