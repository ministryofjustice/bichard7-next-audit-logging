import { v4 as uuid } from "uuid"
import type AuditLogEvent from "./AuditLogEvent"
import AuditLogStatus from "./AuditLogStatus"

export default class AuditLog {
  public readonly messageId: string

  public readonly receivedDate: string

  public caseId: string

  public events: AuditLogEvent[] = []

  public status = AuditLogStatus.processing

  public lastEventType: string

  public readonly version = 0

  constructor(public readonly externalCorrelationId: string, receivedDate: Date, public readonly messageXml: string) {
    this.messageId = uuid()
    this.receivedDate = receivedDate.toISOString()
  }
}
