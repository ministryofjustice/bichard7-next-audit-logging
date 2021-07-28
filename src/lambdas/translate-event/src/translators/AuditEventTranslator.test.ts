import fs from "fs"
import { encodeBase64, isError } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import AuditEventTranslator from "./AuditEventTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const auditEventData = fs.readFileSync("../../../events/audit-event.xml")
  const messageData = encodeBase64(auditEventData.toString())
  const eventInput: TranslateEventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "AuditEvent",
    eventSourceQueueName: "DummyQueueName"
  }
  const result = await AuditEventTranslator(eventInput)

  expect(isError(result)).toBe(false)

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("warning")
  expect(event.eventSource).toBe("ErrorHandlerScreenFlow")
  expect(event.eventType).toBe("Trigger Instances resolved")
  expect(event.timestamp).toBe("2021-06-29T08:34:22.789Z")
  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
