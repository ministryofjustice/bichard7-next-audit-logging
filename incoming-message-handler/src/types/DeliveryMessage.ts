export type DeliveryMessage = {
  DeliverRequest: DeliverRequest
}

export type DeliverRequest = {
  MessageIdentifier: string
  Message: Message
}

export type Message = {
  ResultedCaseMessage: ResultedCaseMessage
}

export type ResultedCaseMessage = {
  Session: Session
}

export type Session = {
  Case: Case
}

export type Case = {
  PTIURN: string
}

export type MessageData = {
  messageId: string
  ptiurn: string
  rawXml: string
}
