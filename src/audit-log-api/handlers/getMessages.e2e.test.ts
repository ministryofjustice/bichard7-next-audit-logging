import type { AxiosError } from "axios"
import axios from "axios"
import { addQueryParams, HttpStatusCode } from "src/shared"
import { createMockAuditLog, createMockAuditLogEvent, createMockAuditLogs, createMockError } from "src/shared/testing"
import type { OutputApiAuditLog } from "src/shared/types"
import { EventCode, isError } from "src/shared/types"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)

describe("Getting Audit Logs", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
  })

  it("should return the audit log records", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const result2 = await axios.get<OutputApiAuditLog[]>(`http://localhost:3010/messages`)
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

    const result2 = await axios.get<OutputApiAuditLog[]>(`http://localhost:3010/messages/${auditLog.messageId}`)
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

    const result = await axios.get<OutputApiAuditLog[]>(`http://localhost:3010/messages?status=Error`)
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result.data)).toBeTruthy()
    const messageIds = result.data.map((record) => record.messageId)
    expect(messageIds).toContain(auditLog2.messageId)
  })

  it("should filter by hash", async () => {
    const auditLog = await createMockAuditLog()
    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const auditLog2 = await createMockError()
    if (isError(auditLog2)) {
      throw new Error("Unexpected error")
    }

    const result = await axios.get<OutputApiAuditLog[]>(
      `http://localhost:3010/messages?messageHash=${auditLog2.messageHash}`
    )
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(result.data).toHaveLength(1)
    expect(result.data[0].messageId).toBe(auditLog2.messageId)
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

    const result = await axios.get<OutputApiAuditLog[]>(
      `http://localhost:3010/messages?externalCorrelationId=${auditLog2.externalCorrelationId}`
    )
    expect(result.status).toEqual(HttpStatusCode.ok)

    expect(Array.isArray(result.data)).toBeTruthy()
    const messageIds = result.data.map((record) => record.messageId)
    expect(messageIds).toEqual([auditLog2.messageId])
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
      const sanitisedAuditLog = await createMockAuditLog({ receivedDate: new Date("2020-10-10").toISOString() })
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
        console.log(sanitiseResult)
        throw new Error("Unexpected error")
      }

      const result = await axios.get<OutputApiAuditLog[]>(`http://localhost:3010/messages?unsanitised=true`)
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

      const result = await axios.get<OutputApiAuditLog[]>(
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

      const eventInclude = await createMockAuditLogEvent(auditLog.messageId, {
        eventCode: EventCode.ExceptionsGenerated
      })
      const eventExclude = await createMockAuditLogEvent(auditLog.messageId)

      if (isError(eventInclude) || isError(eventExclude)) {
        throw new Error("Unexpected error")
      }

      const allResult = await axios.get<OutputApiAuditLog[]>("http://localhost:3010/messages")
      expect(allResult.status).toEqual(HttpStatusCode.ok)
      expect(allResult.data[0]).toHaveProperty("events")
      expect(allResult.data[0].events).toHaveLength(2)

      const filteredResult = await axios.get<OutputApiAuditLog[]>(
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
        eventCode: EventCode.ExceptionsGenerated,
        attributes: { "Message Type": "SPIResults", "Error 1 Details": "HO100300" }
      })
      const eventExclude = await createMockAuditLogEvent(auditLog.messageId)

      if (isError(eventInclude) || isError(eventExclude)) {
        throw new Error("Unexpected error")
      }

      const allResult = await axios.get<OutputApiAuditLog[]>("http://localhost:3010/messages")
      expect(allResult.status).toEqual(HttpStatusCode.ok)
      expect(allResult.data[0]).toHaveProperty("events")
      expect(allResult.data[0].events).toHaveLength(2)

      const filteredResult = await axios.get<OutputApiAuditLog[]>(
        "http://localhost:3010/messages?eventsFilter=topExceptionsReport&start=2000-01-01&end=2099-01-01"
      )
      expect(filteredResult.status).toEqual(HttpStatusCode.ok)
      expect(filteredResult.data[0]).toHaveProperty("events")
      expect(filteredResult.data[0].events).toHaveLength(1)
      expect(filteredResult.data[0].events[0].eventType).toBe(eventInclude.eventType)
    })

    it("should paginate the results using the last message ID", async () => {
      const auditLogs = await createMockAuditLogs(5)
      if (isError(auditLogs)) {
        throw new Error("Unexpected error")
      }

      const result = await axios.get<OutputApiAuditLog[]>(
        `http://localhost:3010/messages?eventsFilter=topExceptionsReport&start=2000-01-01&end=2099-01-01&lastMessageId=${auditLogs[2].messageId}`
      )

      expect(result.data).toHaveLength(2)
      expect(result.data[0].messageId).toBe(auditLogs[1].messageId)
      expect(result.data[1].messageId).toBe(auditLogs[0].messageId)
    })
  })

  describe("including and excluding columns", () => {
    describe.each(
      // prettier-ignore
      [
        ["fetchAll",                     createMockAuditLog, (_: OutputApiAuditLog) => "http://localhost:3010/messages", undefined],
        ["fetchUnsanitised",             createMockAuditLog, (_: OutputApiAuditLog) => "http://localhost:3010/messages?unsanitised=true", undefined],
        ["fetchById",                    createMockAuditLog, (l: OutputApiAuditLog) => `http://localhost:3010/messages/${l.messageId}`, undefined],
        ["fetchByHash",                  createMockAuditLog, (l: OutputApiAuditLog) => `http://localhost:3010/messages?messageHash=${l.messageHash}`, "messageHash"],
        ["fetchByExternalCorrelationId", createMockAuditLog, (l: OutputApiAuditLog) => `http://localhost:3010/messages?externalCorrelationId=${l.externalCorrelationId}`, undefined],
        ["fetchByStatus",                createMockError,    (_: OutputApiAuditLog) => "http://localhost:3010/messages?status=Error", undefined]
      ]
    )("from %s", (_, newAuditLog, baseUrl, indexKey) => {
      it("should not show excluded columns", async () => {
        const auditLog = await newAuditLog()
        if (isError(auditLog)) {
          throw new Error("Unexpected error")
        }

        const defaultResult = await axios.get<OutputApiAuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect(defaultResult.data[0]).toHaveProperty("events")
        expect(defaultResult.data[0]).toHaveProperty("receivedDate")
        const defaultKeys = Object.keys(defaultResult.data[0])

        const excludedResult = await axios.get<OutputApiAuditLog[]>(
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

        const defaultResult = await axios.get<OutputApiAuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect("messageHash" in defaultResult.data[0]).toBe(indexKey === "messageHash")
        const expectedKeys = new Set(Object.keys(defaultResult.data[0]))
        if (indexKey) {
          expectedKeys.add(indexKey)
        }

        const includedResult = await axios.get<OutputApiAuditLog[]>(
          addQueryParams(baseUrl(auditLog), { includeColumns: "messageHash" })
        )

        expectedKeys.add("messageHash")
        expect(includedResult.status).toEqual(HttpStatusCode.ok)
        expect(includedResult.data[0]).toHaveProperty("messageHash")
        expect(Object.keys(includedResult.data[0])).toHaveLength([...expectedKeys].length)
      })

      it("should work with excluded and included columns", async () => {
        const auditLog = await newAuditLog()
        if (isError(auditLog)) {
          throw new Error("Unexpected error")
        }

        const defaultResult = await axios.get<OutputApiAuditLog[]>(baseUrl(auditLog))
        expect(defaultResult.status).toEqual(HttpStatusCode.ok)
        expect("messageHash" in defaultResult.data[0]).toBe(indexKey === "messageHash")
        expect(defaultResult.data[0]).toHaveProperty("events")
        expect(defaultResult.data[0]).toHaveProperty("receivedDate")

        const filteredResult = await axios.get<OutputApiAuditLog[]>(
          addQueryParams(baseUrl(auditLog), {
            includeColumns: "messageHash",
            excludeColumns: "receivedDate,events"
          })
        )

        expect(filteredResult.status).toEqual(HttpStatusCode.ok)
        expect(filteredResult.data[0]).toHaveProperty("messageHash")
        expect(filteredResult.data[0]).not.toHaveProperty("events")
        expect(filteredResult.data[0]).not.toHaveProperty("receivedDate")
      })
    })
  })

  describe("pagination", () => {
    describe.each(
      // prettier-ignore
      [
        ["fetchAll",             true,   "http://localhost:3010/messages"],
        ["fetchUnsanitised",     false,  "http://localhost:3010/messages?unsanitised=true"],
        ["fetchByStatus",        true,   "http://localhost:3010/messages?status=Processing"],
        ["fetchTopExceptions",   true,   "http://localhost:3010/messages?eventsFilter=topExceptionsReport&start=2000-01-01&end=2099-01-01"],
        ["fetchAutomation",      true,   "http://localhost:3010/messages?eventsFilter=automationReport&start=2000-01-01&end=2099-01-01"]
      ]
    )("from %s", (_, descending, baseUrl) => {
      it("should limit the number of records", async () => {
        const auditLogs = await createMockAuditLogs(2)
        if (isError(auditLogs)) {
          throw new Error("Unexpected error")
        }

        const result = await axios.get<OutputApiAuditLog[]>(addQueryParams(baseUrl, { limit: "1" }))

        expect(result.data).toHaveLength(1)
      })

      it("should paginate by last record ID", async () => {
        const auditLogs = await createMockAuditLogs(5)
        if (isError(auditLogs)) {
          throw new Error("Unexpected error")
        }

        const result = await axios.get<OutputApiAuditLog[]>(
          addQueryParams(baseUrl, { lastMessageId: auditLogs[2].messageId })
        )

        expect(result.data).toHaveLength(2)

        // determine which keys will be returned based on the sort order
        const keys = descending ? [1, 0] : [3, 4]
        expect(result.data[0].messageId).toBe(auditLogs[keys[0]].messageId)
        expect(result.data[1].messageId).toBe(auditLogs[keys[1]].messageId)
      })
    })
  })
})
