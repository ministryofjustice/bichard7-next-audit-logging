export default class AuditLogEvent {
  public eventSource: string

  public readonly timestamp: string

  public attributes: { [name: string]: unknown }

  constructor(
    public readonly category: "information" | "error" | "warning",
    timestamp: Date,
    public readonly eventType: string
  ) {
    this.timestamp = timestamp.toISOString()
  }
}
