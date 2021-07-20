import fs from "fs"
import { encodeBase64, isError } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import GeneralEventTranslator from "./GeneralEventTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const generalEventData = fs.readFileSync("../../../events/general-event.xml")
  const messageData = encodeBase64(generalEventData.toString())
  const eventInput: TranslateEventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "AuditEvent"
  }
  const result = await GeneralEventTranslator(eventInput)

  expect(isError(result)).toBe(false)

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("EXTERNAL_CORRELATION_ID")
  expect(event.category).toBe("information")
  expect(event.eventSource).toBe("Hearing Outcome Publication Choreography")
  expect(event.eventType).toBe("Message Received")
  expect(event.timestamp).toBe("2021-06-29T08:35:36.031Z")
  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
