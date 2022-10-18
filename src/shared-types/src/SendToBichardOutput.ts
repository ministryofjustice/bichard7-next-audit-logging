import type AuditLog from "./AuditLog"

export default interface SendToBichardOutput {
  sentAt: Date
  auditLog: AuditLog
}
