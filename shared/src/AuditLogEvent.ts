import { EventCategory, KeyValuePair } from "./types"

export default class AuditLogEvent {
  public eventSource: string

  public readonly timestamp: string

  public attributes: KeyValuePair = {}

  constructor(public readonly category: EventCategory, timestamp: Date, public readonly eventType: string) {
    this.timestamp = timestamp.toISOString()
  }
}
