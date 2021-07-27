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
    messageType: ""
  }
  const result = await CourtResultInputTranslator(eventInput)
  expect(isError(result)).toBe(false)

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("String")
  expect(event.category).toBe("result")
  expect(event.eventSource).toBe("CJSEZ000000")
  expect(event.eventType).toBe("SPIResults")
  expect(event.timestamp).toBe("2001-12-17T14:30:47.000Z")
  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
