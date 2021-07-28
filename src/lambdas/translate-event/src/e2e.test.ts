jest.setTimeout(30000)

import "@bichard/testing-jest"
import fs from "fs"
import { encodeBase64 } from "shared"
import type { MessageFormat, EventCategory } from "shared"
import { invokeFunction } from "@bichard/testing-lambda"
import type TranslateEventInput from "./TranslateEventInput"
import type TranslationResult from "./translators/TranslationResult"

const filenameMappings: Record<MessageFormat, string> = {
  AuditEvent: "audit-event",
  GeneralEvent: "general-event",
  CourtResultInput: "court-result-input"
}

const createPayload = (messageFormat: MessageFormat): TranslateEventInput => {
  const filename = filenameMappings[messageFormat]
  const path = `../../../events/${filename}.xml`
  const content = fs.readFileSync(path).toString()

  return {
    messageData: encodeBase64(content),
    messageFormat,
    eventSourceArn: "DummyArn",
    s3Path: "UNUSED"
  }
}

interface TestInput {
  messageFormat: MessageFormat
  messageId: string
  category: EventCategory
  eventSource: string
  eventType: string
  timestamp: string
}

test.each<TestInput>([
  {
    messageFormat: "AuditEvent",
    messageId: "{MESSAGE_ID}",
    category: "warning",
    eventSource: "ErrorHandlerScreenFlow",
    eventType: "Trigger Instances resolved",
    timestamp: "2021-06-29T08:34:22.789Z"
  },
  {
    messageFormat: "GeneralEvent",
    messageId: "{MESSAGE_ID}",
    category: "information",
    eventSource: "Hearing Outcome Publication Choreography",
    eventType: "Message Received",
    timestamp: "2021-06-29T08:35:36.031Z"
  },
  {
    messageFormat: "CourtResultInput",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "Court Result Input Queue Failure",
    timestamp: "UNUSED"
  }
])("$messageFormat is translated to AuditLogEvent type", async (input: TestInput) => {
  const beforeTimestamp = new Date().toString()
  const payload = createPayload(input.messageFormat)

  const result = await invokeFunction<TranslateEventInput, TranslationResult>("translate-event", payload)
  expect(result).toNotBeError()
  const afterTimestamp = new Date().toString()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe(input.messageId)
  expect(event.category).toBe(input.category)
  expect(event.eventSource).toBe(input.eventSource)
  expect(event.eventType).toBe(input.eventType)
  if (filenameMappings[input.messageFormat] === "court-result-input") {
    expect(new Date(event.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTimestamp).getTime())
    expect(new Date(event.timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTimestamp).getTime())
  } else {
    expect(event.timestamp).toBe(input.timestamp)
  }
  expect(event.eventSourceArn).toBe(payload.eventSourceArn)
  expect(event.s3Path).toBe(payload.s3Path)
})
