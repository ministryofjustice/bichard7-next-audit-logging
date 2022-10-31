import type { AxiosError } from "axios"
import axios from "axios"
import type { AuditLog, AuditLogEventOptions, PromiseResult } from "shared-types"
import { AuditLogEvent, isError } from "shared-types"
import { mockAuditLog, mockAuditLogEvent } from "."

export const createMockError = async (overrides: Partial<AuditLog> = {}): PromiseResult<AuditLog> => {
  const auditLog = mockAuditLog(overrides)
  await axios.post("http://localhost:3010/messages", auditLog)

  const event = mockAuditLogEvent({ category: "error", eventType: "Hearing Outcome Input Queue Failure" })
  const res = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
  if (isError(res)) {
    return res
  }

  auditLog.events.push(event)
  return auditLog
}

export const createMockErrors = async (count = 1, overrides: Partial<AuditLog> = {}): PromiseResult<AuditLog[]> => {
  const output = []
  for (let i = 0; i < count; i++) {
    const res = await createMockError(overrides)
    if (isError(res)) {
      return res
    }
    output.push(res)
  }
  return output
}

export const createMockAuditLog = async (overrides: Partial<AuditLog> = {}): PromiseResult<AuditLog> => {
  const auditLog = mockAuditLog(overrides)
  const res = await axios.post("http://localhost:3010/messages", auditLog).catch((error: AxiosError) => error)
  if (isError(res)) {
    return res
  }
  return auditLog
}

export const createMockAuditLogs = async (count = 1, overrides: Partial<AuditLog> = {}): PromiseResult<AuditLog[]> => {
  const output = []
  for (let i = 0; i < count; i++) {
    const res = await createMockAuditLog(overrides)
    if (isError(res)) {
      return res
    }
    output.push(res)
  }
  return output
}

export const createMockAuditLogEvent = async (
  messageId: string,
  overrides: Partial<AuditLogEventOptions> = {}
): PromiseResult<AuditLogEvent> => {
  const auditLogEvent = new AuditLogEvent({
    eventSource: "test",
    category: "information",
    eventType: "Test event",
    timestamp: new Date(),
    ...overrides
  })

  const res = await axios
    .post(`http://localhost:3010/messages/${messageId}/events`, auditLogEvent)
    .catch((error: AxiosError) => error)
  if (isError(res)) {
    return res
  }

  return auditLogEvent
}

export const createMockRetriedError = async (): PromiseResult<AuditLog> => {
  const auditLog = mockAuditLog()
  await axios.post("http://localhost:3010/messages", auditLog)

  const event = mockAuditLogEvent({ category: "error", eventType: "Hearing Outcome Input Queue Failure" })
  const res = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
  if (isError(res)) {
    return res
  }

  for (let i = 0; i < 3; i++) {
    const retryEvent = mockAuditLogEvent({ category: "information", eventType: "Retrying failed message" })
    const retryRes = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, retryEvent)
    if (isError(retryRes)) {
      return retryRes
    }
  }
  return auditLog
}
