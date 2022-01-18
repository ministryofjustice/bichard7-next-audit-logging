import { mockAuditLog, mockAuditLogEvent } from "."
import axios from "axios"
import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"

export const createMockError = async (): PromiseResult<AuditLog> => {
  const auditLog = mockAuditLog()
  await axios.post("http://localhost:3010/messages", auditLog)

  const event = mockAuditLogEvent("error", "Hearing Outcome Input Queue Failure")
  const res = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
  if (isError(res)) {
    return res
  }
  return auditLog
}

export const createMockErrors = async (count = 1): PromiseResult<AuditLog[]> => {
  const output = []
  for (let i = 0; i < count; i++) {
    const res = await createMockError()
    if (isError(res)) {
      return res
    }
    output.push(res)
  }
  return output
}

export const createMockAuditLog = async (): PromiseResult<AuditLog> => {
  const auditLog = mockAuditLog()
  const res = await axios.post("http://localhost:3010/messages", auditLog)
  if (isError(res)) {
    return res
  }
  return auditLog
}

export const createMockAuditLogs = async (count = 1): PromiseResult<AuditLog[]> => {
  const output = []
  for (let i = 0; i < count; i++) {
    const res = await createMockAuditLog()
    if (isError(res)) {
      return res
    }
    output.push(res)
  }
  return output
}
