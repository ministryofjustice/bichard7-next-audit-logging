jest.retryTimes(10)
import type { AxiosError } from "axios"
import axios from "axios"
import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import { HttpStatusCode } from "shared"
import { createMockAuditLog, createMockError } from "shared-testing"

describe("Getting Audit Logs", () => {
  it("should return the audit log records", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const result2 = await axios.get<AuditLog[]>(`http://localhost:3010/messages`)
    expect(result2.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result2.data)).toBeTruthy()
    const messageIds = result2.data.map((record) => record.messageId)
    expect(messageIds).toContain(auditLog.messageId)
  })

  it("should return 404 status code and empty array", async () => {
    const result2 = await axios
      .get(`http://localhost:3010/messages/dummy-id`)
      .catch((error: AxiosError) => error.response)
    expect(result2).toBeDefined()
    expect(result2!.status).toEqual(HttpStatusCode.notFound)
    expect(result2!.data).toHaveLength(0)
  })

  it("should return a specific audit log record", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const result2 = await axios.get<AuditLog[]>(`http://localhost:3010/messages/${auditLog.messageId}`)
    expect(result2.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result2.data)).toBeTruthy()
    const messageIds = result2.data.map((record) => record.messageId)
    expect(messageIds).toEqual([auditLog.messageId])
  })

  it("should filter by status", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const auditLog2 = await createMockError()
    if (isError(auditLog2)) {
      throw new Error("Unexpected error")
    }

    const result = await axios.get<AuditLog[]>(`http://localhost:3010/messages?status=Error`)
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result.data)).toBeTruthy()
    const messageIds = result.data.map((record) => record.messageId)
    expect(messageIds).toContain(auditLog2.messageId)
  })

  it("should get message by external correlation ID", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const auditLog2 = await createMockError()
    if (isError(auditLog2)) {
      throw new Error("Unexpected error")
    }

    const result = await axios.get<AuditLog[]>(
      `http://localhost:3010/messages?externalCorrelationId=${auditLog2.externalCorrelationId}`
    )
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result.data)).toBeTruthy()
    const messageIds = result.data.map((record) => record.messageId)
    expect(messageIds).toEqual([auditLog2.messageId])
  })

  it("should get message and lookup attribute values", async () => {
    const auditLog = await createMockError()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const result = await axios.get<AuditLog[]>(
      `http://localhost:3010/messages?externalCorrelationId=${auditLog.externalCorrelationId}`
    )
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result.data)).toBeTruthy()
    const actualMessage = result.data[0]

    expect(actualMessage.messageId).toEqual(auditLog.messageId)
    expect(actualMessage.events).toHaveLength(1)

    const { attributes } = actualMessage.events[0]
    expect(attributes["Attribute 1"]).toBe(auditLog.events[0].attributes["Attribute 1"])
    expect(attributes["Attribute 2"]).toBe(auditLog.events[0].attributes["Attribute 2"])
  })
})
