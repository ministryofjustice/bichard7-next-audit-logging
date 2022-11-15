import type { AxiosError } from "axios"
import axios from "axios"
import type { AuditLogEventOptions, InputApiAuditLog, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { AuditLogEvent, AuditLogStatus, isError, PncStatus, TriggerStatus } from "src/shared/types"
import { mockAuditLogEvent, mockInputApiAuditLog } from "."

export const createMockError = async (overrides: Partial<InputApiAuditLog> = {}): PromiseResult<OutputApiAuditLog> => {
  const auditLog = mockInputApiAuditLog(overrides)
  await axios.post("http://localhost:3010/messages", auditLog)

  const event = mockAuditLogEvent({ category: "error", eventType: "Hearing Outcome Input Queue Failure" })
  const res = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
  if (isError(res)) {
    return res
  }

  return {
    ...auditLog,
    events: [event],
    pncStatus: PncStatus.Processing,
    triggerStatus: TriggerStatus.NoTriggers,
    status: AuditLogStatus.processing
  }
}

export const createMockErrors = async (
  count = 1,
  overrides: Partial<InputApiAuditLog> = {}
): PromiseResult<OutputApiAuditLog[]> => {
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

export const createMockAuditLog = async (
  overrides: Partial<InputApiAuditLog> = {}
): PromiseResult<OutputApiAuditLog> => {
  const auditLog = mockInputApiAuditLog(overrides)
  const res = await axios.post("http://localhost:3010/messages", auditLog).catch((error: AxiosError) => error)
  if (isError(res)) {
    return res
  }
  return {
    ...auditLog,
    events: [],
    pncStatus: PncStatus.Processing,
    triggerStatus: TriggerStatus.NoTriggers,
    status: AuditLogStatus.processing
  }
}

export const createMockAuditLogs = async (
  count = 1,
  overrides: Partial<InputApiAuditLog> = {}
): PromiseResult<OutputApiAuditLog[]> => {
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

export const createMockRetriedError = async (): PromiseResult<OutputApiAuditLog> => {
  const events: AuditLogEvent[] = []
  const auditLog = mockInputApiAuditLog()
  await axios.post("http://localhost:3010/messages", auditLog)

  const event = mockAuditLogEvent({ category: "error", eventType: "Hearing Outcome Input Queue Failure" })
  const res = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
  if (isError(res)) {
    return res
  }
  events.push(event)

  for (let i = 0; i < 3; i++) {
    const retryEvent = mockAuditLogEvent({ category: "information", eventType: "Retrying failed message" })
    const retryRes = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, retryEvent)
    if (isError(retryRes)) {
      return retryRes
    }
    events.push(retryEvent)
  }

  return {
    ...auditLog,
    events,
    pncStatus: PncStatus.Processing,
    triggerStatus: TriggerStatus.NoTriggers,
    status: AuditLogStatus.processing
  }
}
