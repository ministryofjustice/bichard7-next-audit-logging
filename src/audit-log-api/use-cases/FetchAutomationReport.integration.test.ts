import { mockApiAuditLogEvent, mockDynamoAuditLog } from "src/shared/testing"
import { DynamoAuditLog } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import FetchAutomationReport from "./FetchAutomationReport"

const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)

describe("FetchAutomationReport", () => {
  let fetcher: FetchAutomationReport

  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
    fetcher = new FetchAutomationReport(gateway, { start: new Date("2020-01-01"), end: new Date("2100-01-01") })
  })

  it("should merge events for the automation report", async () => {
    const auditLog = mockDynamoAuditLog()
    auditLog.automationReport = {
      events: [mockApiAuditLogEvent({ eventType: "Internal Type 1", timestamp: "2022-11-11T10:00:00" })],
      forceOwner: "010000"
    }
    await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    const externalEvent1 = {
      ...mockApiAuditLogEvent(),
      eventType: "Type 1",
      _messageId: auditLog.messageId,
      _automationReport: 0
    }
    await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent1, gateway.eventsTableKey)

    const externalEvent2 = {
      ...mockApiAuditLogEvent(),
      eventType: "Type 2",
      _messageId: auditLog.messageId,
      _automationReport: 1,
      timestamp: "2022-11-11T11:00:00"
    }
    await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent2, gateway.eventsTableKey)

    const result = await fetcher.fetch()

    expect(result).toNotBeError()

    const actualAuditLogs = result as DynamoAuditLog[]
    expect(actualAuditLogs).toHaveLength(1)
    expect(actualAuditLogs[0].events).toHaveLength(2)
    expect(actualAuditLogs[0].events[0].eventType).toBe("Internal Type 1")
    expect(actualAuditLogs[0].events[1].eventType).toBe("Type 2")
  })
})
