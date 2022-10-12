import type { AxiosError } from "axios"
import axios from "axios"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { auditLogDynamoConfig, createMockAuditLog, createMockAuditLogEvent, createMockError } from "shared-testing"
import type { AuditLog } from "shared-types"
import { isError } from "shared-types"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)

const addQueryParams = (url: string, params: { [key: string]: string }): string => {
  const u = new URL(url)
  Object.keys(params).forEach((param) => u.searchParams.append(param, params[param]))
  return u.href
}

describe("Getting Audit Logs", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.TABLE_NAME, "messageId")
  })

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

  describe("fetching unsanitised messages", () => {
    it("should return unsanitised messages", async () => {
      const unsanitisedAuditLog = await createMockAuditLog({
        isSanitised: 0,
        nextSanitiseCheck: new Date("2020-10-10").toISOString()
      })

      if (isError(unsanitisedAuditLog)) {
        throw new Error("Unexpected error")
      }
      const sanitisedAuditLog = await createMockAuditLog()
      if (isError(sanitisedAuditLog)) {
        throw new Error("Unexpected error")
      }

      const sanitiseResult = await axios.post(
        `http://localhost:3010/messages/${sanitisedAuditLog.messageId}/sanitise`,
        null,
        {
          validateStatus: undefined
        }
      )

      if (isError(sanitiseResult) || sanitiseResult.status != HttpStatusCode.noContent) {
        throw new Error("Unexpected error")
      }

      const result = await axios.get<AuditLog[]>(`http://localhost:3010/messages?unsanitised=true`)
      expect(result.status).toEqual(HttpStatusCode.ok)

      expect(Array.isArray(result.data)).toBeTruthy()
      const messageIds = result.data.map((record) => record.messageId)
      expect(messageIds).toContain(unsanitisedAuditLog.messageId)
      expect(messageIds).not.toContain(sanitisedAuditLog.messageId)
    })
  })

  describe("fetching messages with a filter on the events (automationRate)", () => {
    it("should return messages in the correct time range", async () => {
      const promises = [
        "2022-01-01T00:00:00Z",
        "2022-01-02T00:00:00Z",
        "2022-01-03T00:00:00Z",
        "2022-01-04T00:00:00Z"
      ].map((receivedDate) => createMockAuditLog({ receivedDate }))
      const createResults = await Promise.all(promises)

      if (
        isError(createResults[0]) ||
        isError(createResults[1]) ||
        isError(createResults[2]) ||
        isError(createResults[3])
      ) {
        throw new Error("Unexpected error")
      }

      const result = await axios.get<AuditLog[]>(
        `http://localhost:3010/messages?eventsFilter=automationReport&start=2022-01-02&end=2022-01-03`
      )
      expect(result.status).toEqual(HttpStatusCode.ok)

      expect(Array.isArray(result.data)).toBeTruthy()
      const messageIds = result.data.map((record) => record.messageId)
      expect(messageIds).not.toContain(createResults[0].messageId)
      expect(messageIds).toContain(createResults[1].messageId)
      expect(messageIds).toContain(createResults[2].messageId)
      expect(messageIds).not.toContain(createResults[3].messageId)
    })
  })

  describe("fetchAutomationReport", () => {
    it("should only include events for automation report", async () => {
      const auditLog = await createMockAuditLog()
      if (isError(auditLog)) {
        throw new Error("Unexpected error")
      }

      const eventInclude = await createMockAuditLogEvent(auditLog.messageId, { eventType: "Exceptions generated" })
      const eventExclude = await createMockAuditLogEvent(auditLog.messageId)

      if (isError(eventInclude) || isError(eventExclude)) {
        throw new Error("Unexpected error")
      }

      const allResult = await axios.get<AuditLog[]>("http://localhost:3010/messages")
      expect(allResult.status).toEqual(HttpStatusCode.ok)
      expect(allResult.data[0]).toHaveProperty("events")
      expect(allResult.data[0].events).toHaveLength(2)

      const filteredResult = await axios.get<AuditLog[]>(
        "http://localhost:3010/messages?eventsFilter=automationReport&start=2000-01-01&end=2099-01-01"
      )
      expect(filteredResult.status).toEqual(HttpStatusCode.ok)
      expect(filteredResult.data[0]).toHaveProperty("events")
      expect(filteredResult.data[0].events).toHaveLength(1)
      expect(filteredResult.data[0].events[0].eventType).toBe(eventInclude.eventType)
    })
  })

  describe("fetchTopExceptionsReport", () => {
    it("should only include events for top exceptions report", async () => {
      const auditLog = await createMockAuditLog()
      if (isError(auditLog)) {
        throw new Error("Unexpected error")
      }

      const eventInclude = await createMockAuditLogEvent(auditLog.messageId, {
        attributes: { "Message Type": "SPIResults", "Error 1 Details": "HO100300" }
      })
      const eventExclude = await createMockAuditLogEvent(auditLog.messageId)

      if (isError(eventInclude) || isError(eventExclude)) {
        throw new Error("Unexpected error")
      }

      const allResult = await axios.get<AuditLog[]>("http://localhost:3010/messages")
      expect(allResult.status).toEqual(HttpStatusCode.ok)
      expect(allResult.data[0]).toHaveProperty("events")
      expect(allResult.data[0].events).toHaveLength(2)

      const filteredResult = await axios.get<AuditLog[]>(
        "http://localhost:3010/messages?eventsFilter=topExceptionsReport&start=2000-01-01&end=2099-01-01"
      )
      expect(filteredResult.status).toEqual(HttpStatusCode.ok)
      expect(filteredResult.data[0]).toHaveProperty("events")
      expect(filteredResult.data[0].events).toHaveLength(1)
      expect(filteredResult.data[0].events[0].eventType).toBe(eventInclude.eventType)
    })
  })

  describe("including and excluding columns", () => {
    describe.each(
      // prettier-ignore
      [
        ["fetchAll",                     createMockAuditLog, (_: AuditLog) => "http://localhost:3010/messages"],
        ["fetchUnsanitised",             createMockAuditLog, (_: AuditLog) => "http://localhost:3010/messages?unsanitised=true"],
        ["fetchById",                    createMockAuditLog, (l: AuditLog) => `http://localhost:3010/messages/${l.messageId}`],
        ["fetchByExternalCorrelationId", createMockAuditLog, (l: AuditLog) => `http://localhost:3010/messages?externalCorrelationId=${l.externalCorrelationId}`],
        ["fetchByStatus",                createMockError,    (_: AuditLog) => "http://localhost:3010/messages?status=Error"]
      ]
    )("from %s", (_, newAuditLog, baseUrl) => {
      it("should not show excluded columns", async () => {
        const auditLog = await newAuditLog()
        if (isError(auditLog)) {
          throw new Error("Unexpected error")
        }

        const defaultResult = await axios.get<AuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect(defaultResult.data[0]).toHaveProperty("events")
        expect(defaultResult.data[0]).toHaveProperty("receivedDate")
        const defaultKeys = Object.keys(defaultResult.data[0])

        const excludedResult = await axios.get<AuditLog[]>(
          addQueryParams(baseUrl(auditLog), { excludeColumns: "receivedDate,events" })
        )

        expect(excludedResult.status).toEqual(HttpStatusCode.ok)
        expect(excludedResult.data[0]).not.toHaveProperty("events")
        expect(excludedResult.data[0]).not.toHaveProperty("receivedDate")
        expect(Object.keys(excludedResult.data[0])).toHaveLength(defaultKeys.length - 2)
      })

      it("should show included columns", async () => {
        const auditLog = await newAuditLog()
        if (isError(auditLog)) {
          throw new Error("Unexpected error")
        }

        const defaultResult = await axios.get<AuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect(defaultResult.data[0]).not.toHaveProperty("version")
        expect(defaultResult.data[0]).not.toHaveProperty("messageHash")
        const defaultKeys = Object.keys(defaultResult.data[0])

        const includedResult = await axios.get<AuditLog[]>(
          addQueryParams(baseUrl(auditLog), { includeColumns: "version,messageHash" })
        )

        expect(includedResult.status).toEqual(HttpStatusCode.ok)
        expect(includedResult.data[0]).toHaveProperty("version")
        expect(includedResult.data[0]).toHaveProperty("messageHash")
        expect(Object.keys(includedResult.data[0])).toHaveLength(defaultKeys.length + 2)
      })

      it("should work with excluded and included columns", async () => {
        const auditLog = await newAuditLog()
        if (isError(auditLog)) {
          throw new Error("Unexpected error")
        }

        const defaultResult = await axios.get<AuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect(defaultResult.data[0]).not.toHaveProperty("version")
        expect(defaultResult.data[0]).not.toHaveProperty("messageHash")
        expect(defaultResult.data[0]).toHaveProperty("events")
        expect(defaultResult.data[0]).toHaveProperty("receivedDate")

        const filteredResult = await axios.get<AuditLog[]>(
          addQueryParams(baseUrl(auditLog), {
            includeColumns: "version,messageHash",
            excludeColumns: "receivedDate,events"
          })
        )

        expect(filteredResult.status).toEqual(HttpStatusCode.ok)
        expect(filteredResult.data[0]).toHaveProperty("version")
        expect(filteredResult.data[0]).toHaveProperty("messageHash")
        expect(filteredResult.data[0]).not.toHaveProperty("events")
        expect(filteredResult.data[0]).not.toHaveProperty("receivedDate")
      })
    })
  })
})
