jest.retryTimes(10)
import axios from "axios"
import { HttpStatusCode } from "shared"
import { mockAuditLog, mockAuditLogEvent } from "shared-testing"
import type { AuditLogEvent, BichardAuditLogEvent } from "shared-types"

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

    expect(result3.data).toEqual([{ ...event, automationReport: false, topExceptionsReport: false }])
  })

  it("should not look up large objects when largeObjects parameter set to false", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()

    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const resultWithValueLookup = await axios.get<AuditLogEvent[]>(
      `http://localhost:3010/messages/${auditLog.messageId}/events?largeObjects=true`
    )

    expect(resultWithValueLookup.status).toEqual(HttpStatusCode.ok)

    const eventsWithValueLookup = resultWithValueLookup.data as unknown as BichardAuditLogEvent[]
    expect(eventsWithValueLookup[0].eventXml).toMatch(/(?:Test event xml)*/)
    expect(eventsWithValueLookup[0].attributes["Attribute 1"]).toMatch(/(?:Attribute 1 dataAttribute)*/)
    expect(eventsWithValueLookup[0].attributes["Attribute 2"]).toBe("Attribute 2 data")

    const resultWithoutValueLookup = await axios.get<AuditLogEvent[]>(
      `http://localhost:3010/messages/${auditLog.messageId}/events?largeObjects=false`
    )
    expect(resultWithoutValueLookup.status).toEqual(HttpStatusCode.ok)

    const eventsWithoutValueLookup = resultWithoutValueLookup.data as unknown as BichardAuditLogEvent[]
    expect(eventsWithoutValueLookup[0].eventXml).toHaveProperty("valueLookup")
    expect(eventsWithoutValueLookup[0].attributes["Attribute 1"]).toHaveProperty("valueLookup")
    expect(eventsWithoutValueLookup[0].attributes["Attribute 2"]).toBe("Attribute 2 data")
  })
})
