export default class AuditLog {
  public caseId: string

  constructor(
    public readonly messageId: string,
    public readonly receivedDate: Date,
    public readonly messageXml?: string
  ) {}
}
