import { v4 as uuid } from "uuid"
import type AuditLogEventOptions from "./AuditLogEventOptions"
import type EventCategory from "./EventCategory"

export type AuditLogEventAttributeLookupValue = { valueLookup: string }

export type AuditLogEventAttributeCompressedValue = { _compressedValue: string }

export type AuditLogEventDecompressedAttributeValue = string | number | boolean

export type AuditLogEventAttributes = {
  [key: string]: AuditLogEventAttributeValue
}

export type AuditLogEventDecompressedAttributes = {
  [key: string]: AuditLogEventDecompressedAttributeValue
}

export type AuditLogEventAttributeValue =
  | AuditLogEventDecompressedAttributeValue
  | AuditLogEventAttributeCompressedValue
  | AuditLogEventAttributeLookupValue

// TODO: Split this into a type an an implementation
export default class AuditLogEvent {
  public attributes: AuditLogEventAttributes = {}

  public readonly category: EventCategory

  public readonly eventSource: string

  public readonly eventSourceQueueName?: string

  public readonly eventType: string

  public readonly eventXml?: string

  public readonly _id?: string

  public readonly timestamp: string

  public _automationReport?: number

  public _topExceptionsReport?: number

  public eventCode?: string

  public _messageId?: string

  public user?: string

  constructor(options: AuditLogEventOptions) {
    this._automationReport = options._automationReport
    this._id = options._id ?? uuid()
    this._messageId = options._messageId
    this._topExceptionsReport = options._topExceptionsReport
    this.attributes = options.attributes ?? {}
    this.category = options.category
    this.eventCode = options.eventCode
    this.eventSource = options.eventSource
    this.eventSourceQueueName = options.eventSourceQueueName
    this.eventType = options.eventType
    this.eventXml = options.eventXml
    this.timestamp = new Date(options.timestamp).toISOString()
    this.user = options.user
  }

  addAttribute(name: string, value: AuditLogEventAttributeValue): void {
    this.attributes[name] = value
  }
}
