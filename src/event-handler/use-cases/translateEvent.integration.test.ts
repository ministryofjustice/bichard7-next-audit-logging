jest.setTimeout(30000)

import fs from "fs"
import { decodeBase64, encodeBase64 } from "src/shared"
import "src/shared/testing"
import type { EventCategory, MessageFormat } from "src/shared/types"
import type { EventInput } from "../types"
import translateEvent from "./translateEvent"
import type TranslationResult from "./translators/TranslationResult"

const filenameMappings: Record<MessageFormat, string> = {
  GeneralEvent: "general-event",
  CourtResultInput: "court-result-input",
  HearingOutcomePncUpdate: "hearing-outcome-pnc-update",
  DataSetPncUpdate: "data-set-pnc-update",
  HearingOutcomeInput: "hearing-outcome-input",
  PncUpdateRequest: "pnc-update-request",
  ProcessingValidation: "processing-validation"
}

const createPayload = (messageFormat: MessageFormat): EventInput => {
  const filename = filenameMappings[messageFormat]
  const path = `events/${filename}.xml`
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
  },
  {
    messageFormat: "HearingOutcomePncUpdate",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "Hearing Outcome PNC Update Queue Failure"
  },
  {
    messageFormat: "DataSetPncUpdate",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "Data Set PNC Update Queue Failure"
  },
  {
    messageFormat: "HearingOutcomeInput",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "Hearing Outcome Input Queue Failure"
  },
  {
    messageFormat: "PncUpdateRequest",
    messageId: "{MESSAGE_ID}",
    category: "error",
    eventSource: "Translate Event",
    eventType: "PNC Update Request Queue Failure"
  }
])("$messageFormat is translated to AuditLogEvent type", async (input: TestInput) => {
  const payload = createPayload(input.messageFormat)

  const result = await translateEvent(payload)
  expect(result).toNotBeError()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe(input.messageId)
  expect(event.category).toBe(input.category)
  expect(event.eventSource).toBe(input.eventSource)
  expect(event.eventType).toBe(input.eventType)
  expect(event.eventXml).toBe(event.category === "error" ? decodeBase64(payload.messageData) : undefined)
  expect(event.eventSourceQueueName).toBe(payload.eventSourceQueueName)
})
