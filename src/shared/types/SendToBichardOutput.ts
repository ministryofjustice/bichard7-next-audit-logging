import type { InputApiAuditLog } from "./AuditLog"

export default interface SendToBichardOutput {
  sentAt: string
  auditLog: InputApiAuditLog
}
