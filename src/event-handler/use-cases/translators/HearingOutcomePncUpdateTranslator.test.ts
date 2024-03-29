import fs from "fs"
import { decodeBase64, encodeBase64 } from "src/shared"
import "src/shared/testing"
import type { EventInput } from "../../types"
import HearingOutcomePncUpdateTranslator from "./HearingOutcomePncUpdateTranslator"
import type TranslationResult from "./TranslationResult"

test("parses the message data and returns a HearingOutcomePncUpdate", async () => {
  const eventData = fs.readFileSync("events/hearing-outcome-pnc-update.xml")
  const messageData = encodeBase64(eventData.toString())
  const eventInput: EventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "HearingOutcomePncUpdate",
    eventSourceQueueName: "DummyQueueName"
  }
  const beforeDate = new Date()
  const result = await HearingOutcomePncUpdateTranslator(eventInput)
  expect(result).toNotBeError()
  const afterDate = new Date()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("error")
  expect(event.eventSource).toBe("Translate Event")
  expect(event.eventType).toBe("Hearing Outcome PNC Update Queue Failure")

  const eventTimestamp = new Date(event.timestamp)
  expect(eventTimestamp).toBeBetween(beforeDate, afterDate)

  expect(event.eventXml).toBe(decodeBase64(messageData))
})
