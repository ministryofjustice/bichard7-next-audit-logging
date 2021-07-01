import { v4 as uuid } from "uuid"
import AuditLogEvent from "./AuditLogEvent"
import { AuditLogStatus } from "./utils"

export default class AuditLog {
  public readonly messageId: string

  public readonly receivedDate: string

  public caseId: string

  public events: AuditLogEvent[] = []

  public status = AuditLogStatus.processing

  public error: string

  constructor(public readonly externalCorrelationId: string, receivedDate: Date, public readonly messageXml: string) {
    this.messageId = uuid()
    this.receivedDate = receivedDate.toISOString()
  }
}
