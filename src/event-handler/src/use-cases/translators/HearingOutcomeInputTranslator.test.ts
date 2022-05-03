import "shared-testing"
import fs from "fs"
import { decodeBase64, encodeBase64 } from "shared"
import type { EventInput } from "../../types"
import type TranslationResult from "./TranslationResult"
import HearingOutcomeInputTranslator from "./HearingOutcomeInputTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const eventData = fs.readFileSync("../../events/hearing-outcome-input.xml")
  const messageData = encodeBase64(eventData.toString())
  const eventInput: EventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "HearingOutcomeInput",
    eventSourceQueueName: "DummyQueueName"
  }
  const beforeDate = new Date()
  const result = await HearingOutcomeInputTranslator(eventInput)
  expect(result).toNotBeError()
  const afterDate = new Date()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("error")
  expect(event.eventSource).toBe("Translate Event")
  expect(event.eventType).toBe("Hearing Outcome Input Queue Failure")

  const eventTimestamp = new Date(event.timestamp)
  expect(eventTimestamp).toBeBetween(beforeDate, afterDate)

  expect(event.eventXml).toBe(decodeBase64(messageData))
  expect(event.eventSourceArn).toBe("DummyArn")
})
