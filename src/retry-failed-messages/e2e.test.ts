//
import { TestS3Gateway } from "src/shared"
import "src/shared/testing"
import {
  auditLogEventsS3Config,
  clearDynamoTable,
  createMockAuditLog,
  createMockAuditLogEvent,
  setEnvironmentVariables
} from "src/shared/testing"
import type { AuditLogEventOptions } from "src/shared/types"
import { isError } from "src/shared/types"
import { v4 as uuid } from "uuid"

setEnvironmentVariables()
process.env.MESSAGE_FORMAT = "AuditEvent"
process.env.BUCKET_NAME = "auditLogEventsBucket"

import handler from "./index"

const auditLogTableName = "auditLogTable"
const auditLogLookupTableName = "auditLogLookupTable"

const s3Gateway = new TestS3Gateway(auditLogEventsS3Config)

describe("Retry Failed Messages", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
    await clearDynamoTable(auditLogTableName, "messageId")
    await clearDynamoTable(auditLogLookupTableName, "id")
  })

  it("should retry the correct messages using eventXml for the first time", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const auditLog = await createMockAuditLog({ receivedDate: new Date(Date.now() - 3_600_000).toISOString() })

    if (isError(auditLog)) {
      throw new Error("Unexpected error")
    }

    const auditLogEvent: AuditLogEventOptions = {
      eventSource: "Dummy Event Source",
      eventSourceQueueName: "DUMMY_QUEUE",
      eventType: "Dummy Failed Message",
      category: "error",
      timestamp: new Date(),
      eventXml: messageXml
    }

    const event = await createMockAuditLogEvent(auditLog.messageId, auditLogEvent)
    if (isError(event)) {
      throw new Error("Unexpected error")
    }

    const result = await handler()

    expect(result).toEqual({ retried: [auditLog.messageId], errored: [] })
  })
})
