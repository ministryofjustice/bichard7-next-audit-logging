export default class AuditLogEvent {
  public readonly eventSource: string

  public readonly timestamp: string

  public attributes: Record<string, unknown>

  constructor(public readonly category: string, timestamp: Date, public readonly eventType: string) {
    this.timestamp = timestamp.toISOString()
  }
}
