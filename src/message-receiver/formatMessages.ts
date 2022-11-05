import { decodeBase64 } from "src/shared"
import type { AmazonMqEventSourceRecordEvent, EventMessage, JmsTextMessage, MessageFormat } from "src/shared/types"

type MessageFormatter = (message: JmsTextMessage, eventSourceArn: string, messageFormat: MessageFormat) => unknown

const getEventSourceQueueName = (message: JmsTextMessage): string => {
  return message.destination.physicalName.replace(".FAILURE", "")
}

const annotateWithMqDetails = (
  message: JmsTextMessage,
  eventSourceArn: string,
  messageFormat: MessageFormat
): EventMessage => {
  return {
    messageData: message.data,
    messageFormat,
    eventSourceArn,
    eventSourceQueueName: getEventSourceQueueName(message)
  }
}

const decodeMessagePayload = (message: JmsTextMessage): unknown => {
  return JSON.parse(decodeBase64(message.data))
}

const messageFormatters: Record<MessageFormat, MessageFormatter> = {
  AuditEvent: annotateWithMqDetails,
  GeneralEvent: annotateWithMqDetails,
  CourtResultInput: annotateWithMqDetails,
  DataSetPncUpdate: annotateWithMqDetails,
  HearingOutcomePncUpdate: annotateWithMqDetails,
  HearingOutcomeInput: annotateWithMqDetails,
  PncUpdateRequest: annotateWithMqDetails,
  ProcessingValidation: decodeMessagePayload
}

export default (
  { messages, eventSourceArn }: AmazonMqEventSourceRecordEvent,
  messageFormat: MessageFormat
): unknown[] => {
  return messages.map((message) => {
    const messageFormatter = messageFormatters[messageFormat] ?? annotateWithMqDetails
    return messageFormatter(message, eventSourceArn, messageFormat)
  })
}
