import fs from "fs"
import { decodeBase64, encodeBase64 } from "src/shared"
import "src/shared/testing"
import type { EventInput } from "../../types"
import CourtResultInputTranslator from "./CourtResultInputTranslator"
import type TranslationResult from "./TranslationResult"

test("parses the message data and returns an AuditLogEvent", async () => {
  const generalEventData = fs.readFileSync("events/court-result-input.xml")
  const messageData = encodeBase64(generalEventData.toString())
  const eventInput: EventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "CourtResultInput",
    eventSourceQueueName: "DummyQueueName"
  }
  const beforeDate = new Date()
  const result = await CourtResultInputTranslator(eventInput)
  expect(result).toNotBeError()
  const afterDate = new Date()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("error")
  expect(event.eventSource).toBe("Translate Event")
  expect(event.eventType).toBe("Court Result Input Queue Failure")

  const eventTimestamp = new Date(event.timestamp)
  expect(eventTimestamp).toBeBetween(beforeDate, afterDate)

  expect(event.eventXml).toBe(decodeBase64(messageData))
})
