import fs from "fs"
import { encodeBase64, isError } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import CourtResultInputTranslator from "./CourtResultInputTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const generalEventData = fs.readFileSync("../../../events/court-result-input.xml")
  const messageData = encodeBase64(generalEventData.toString())
  const eventInput: TranslateEventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "CourtResultInput",
    eventSourceQueueName: "DummyQueueName"
  }
  const beforeDate = new Date()
  const result = await CourtResultInputTranslator(eventInput)
  expect(isError(result)).toBe(false)
  const afterDate = new Date()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("error")
  expect(event.eventSource).toBe("Translate Event")
  expect(event.eventType).toBe("Court Result Input Queue Failure")
  expect(new Date(event.timestamp).getTime()).toBeGreaterThanOrEqual(beforeDate.getTime())
  expect(new Date(event.timestamp).getTime()).toBeLessThanOrEqual(afterDate.getTime())

  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
