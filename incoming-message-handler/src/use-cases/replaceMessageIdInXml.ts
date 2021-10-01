import type { AuditLog } from "shared"

export default (auditLog: AuditLog): string => {
  const newElement = `<CorrelationID>${auditLog.messageId}</CorrelationID>`
  return auditLog.messageXml.replace(/<CorrelationID>(.*)<\/CorrelationID>/s, newElement)
}
