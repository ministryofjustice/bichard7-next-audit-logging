import type { AuditLog } from "shared"

export default (auditLog: AuditLog): string => {
  const newElement = `<msg:MessageIdentifier>${auditLog.messageId}</msg:MessageIdentifier>`
  return auditLog.messageXml.replace(/<msg:MessageIdentifier>(.*)<\/msg:MessageIdentifier>/s, newElement)
}
