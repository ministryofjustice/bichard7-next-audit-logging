import { v4 as uuid } from "uuid"

export default class AuditLog {
  public readonly messageId: string

  public caseId: string

  constructor(
    public readonly externalCorrelationId: string,
    public readonly receivedDate: Date,
    public readonly messageXml: string
  ) {
    this.messageId = uuid()
  }
}
