import { v4 as uuid } from "uuid"
import type AuditLogEvent from "./AuditLogEvent"
import AuditLogStatus from "./AuditLogStatus"
import type AutomationReport from "./AutomationReport"
import type TopExceptionsReport from "./TopExceptionsReport"

export default class AuditLog {
  public readonly messageId: string

  public readonly receivedDate: string

  public caseId: string

  public events: AuditLogEvent[] = []

  public automationReport: AutomationReport = { events: [] }

  public topExceptionsReport: TopExceptionsReport = { events: [] }

  public status = AuditLogStatus.processing

  public lastEventType: string

  public createdBy: string

  public s3Path: string

  public externalId: string

  public stepExecutionId: string

  public readonly version = 0

  constructor(public readonly externalCorrelationId: string, receivedDate: Date, public readonly messageXml: string) {
    this.messageId = uuid()
    this.receivedDate = receivedDate.toISOString()
  }
}