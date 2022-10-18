import type AuditLog from "./AuditLog"

export default interface SendToBichardOutput {
  sentAt: string
  auditLog: AuditLog
}
