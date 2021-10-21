import "@bichard/testing-jest"
import fs from "fs"
import { encodeBase64 } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import HearingOutcomeInputTranslator from "./HearingOutcomeInputTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const eventData = fs.readFileSync("../../../events/hearing-outcome-input.xml")
  const messageData = encodeBase64(eventData.toString())
  const eventInput: TranslateEventInput = {
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

  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
