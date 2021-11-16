import fs from "fs"
import { encodeBase64, isError } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import GeneralEventTranslator from "./GeneralEventTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const generalEventData = fs.readFileSync("../../../events/report-run-event.xml")
  const messageData = encodeBase64(generalEventData.toString())
  const eventInput: TranslateEventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "GeneralEvent",
    eventSourceQueueName: "DummyQueueName"
  }
  const result = await GeneralEventTranslator(eventInput)

  expect(isError(result)).toBe(false)

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("")
  expect(event.category).toBe("information")
  expect(event.eventSource).toBe("Reporting Screen Flow")
  expect(event.eventType).toBe("Report run")
  expect(event.timestamp).toBe("2021-11-10T10:40:16.388Z")
  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
