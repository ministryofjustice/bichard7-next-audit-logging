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
    s3Path: "UNUSED",
    eventSourceQueueName: "DummyQueueName"
  }
}

interface TestInput {
  messageFormat: MessageFormat
  messageId: string
  category: EventCategory
  eventSource: string
  eventType: string
}

test.each<TestInput>([
  {
    messageFormat: "AuditEvent",
    messageId: "{MESSAGE_ID}",
    category: "warning",
    eventSource: "ErrorHandlerScreenFlow",
    eventType: "Trigger Instances resolved"
  },
  {
    messageFormat: "GeneralEvent",
    messageId: "{MESSAGE_ID}",
    category: "information",
    eventSource: "Hearing Outcome Publication Choreography",
    eventType: "Message Received"
  },
  {
    messageFormat: "CourtResultInput",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "Court Result Input Queue Failure"
  }
])("$messageFormat is translated to AuditLogEvent type", async (input: TestInput) => {
  const payload = createPayload(input.messageFormat)

  const result = await invokeFunction<TranslateEventInput, TranslationResult>("translate-event", payload)
  expect(result).toNotBeError()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe(input.messageId)
  expect(event.category).toBe(input.category)
  expect(event.eventSource).toBe(input.eventSource)
  expect(event.eventType).toBe(input.eventType)
  expect(event.eventSourceArn).toBe(payload.eventSourceArn)
  expect(event.s3Path).toBe(payload.s3Path)
  expect(event.eventSourceQueueName).toBe(payload.eventSourceQueueName)
})
