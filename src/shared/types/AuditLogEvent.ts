import type EventCategory from "./EventCategory"

export type AuditLogEventAttributeLookupValue = { valueLookup: string }

export type AuditLogEventCompressedValue = { _compressedValue: string }

export type AuditLogEventDecompressedAttributeValue = string | number | boolean

export type AuditLogEventAttributes = {
  [key: string]: AuditLogEventAttributeValue
}

export type AuditLogEventDecompressedAttributes = {
  [key: string]: AuditLogEventDecompressedAttributeValue
}

export type AuditLogEventAttributeValue =
  | AuditLogEventDecompressedAttributeValue
  | AuditLogEventCompressedValue
  | AuditLogEventAttributeLookupValue

export type ApiAuditLogEvent = {
  attributes: AuditLogEventAttributes
  category: EventCategory
  eventCode: string
  eventSource: string
  eventSourceQueueName?: string
  eventType: string
  eventXml?: string | AuditLogEventCompressedValue
  timestamp: string
  user?: string
}

export type DynamoAuditLogEvent = ApiAuditLogEvent & {
  _automationReport: number
  _messageId: string
  _topExceptionsReport: number
}
