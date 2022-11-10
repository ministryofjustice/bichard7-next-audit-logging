import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockAuditLog, mockAuditLogEvent } from "src/shared/testing"
import type { AuditLogEvent } from "src/shared/types"

describe("Getting Audit Log events", () => {
  it("should return the audit log events for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const result3 = await axios.get<AuditLogEvent[]>(`http://localhost:3010/messages/${auditLog.messageId}/events`)
    expect(result3.status).toEqual(HttpStatusCode.ok)

    expect(result3.data).toEqual([
      {
        category: event.category,
        eventCode: event.eventCode,
        eventSource: event.eventSource,
        eventSourceQueueName: event.eventSourceQueueName,
        eventType: event.eventType,
        eventXml: event.eventXml,
        timestamp: event.timestamp,
        attributes: event.attributes
      }
    ])
  })
})
