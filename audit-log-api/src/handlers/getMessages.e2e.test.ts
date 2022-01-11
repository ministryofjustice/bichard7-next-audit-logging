import axios from "axios"
import { AuditLog } from "shared-types"
import { HttpStatusCode } from "shared"
import { mockAuditLog } from '../test-helpers/mocks'


describe("Getting Audit Logs", () => {
  it("should return the audit log records", async () => {
    const auditLog = mockAuditLog()

    const result = await axios.post('http://localhost:3000/messages', auditLog)
    expect(result.status).toEqual(HttpStatusCode.created)

    const result2 = await axios.get<AuditLog[]>(`http://localhost:3000/messages`)
    expect(result2.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result2.data)).toBeTruthy()
    const messageIds = result2.data.map(record => record.messageId)
    expect(messageIds).toContain(auditLog.messageId)
  })

  it("should return a specific audit log record", async () => {
    const auditLog = mockAuditLog()

    const result = await axios.post('http://localhost:3000/messages', auditLog)
    expect(result.status).toEqual(HttpStatusCode.created)

    const result2 = await axios.get<AuditLog[]>(`http://localhost:3000/messages/${auditLog.messageId}`)
    expect(result2.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result2.data)).toBeTruthy()
    const messageIds = result2.data.map(record => record.messageId)
    expect(messageIds).toEqual([auditLog.messageId])
  })
})