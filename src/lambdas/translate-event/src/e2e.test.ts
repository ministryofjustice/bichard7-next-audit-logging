jest.setTimeout(30000)

import "shared-testing"
import fs from "fs"
import { encodeBase64 } from "shared"
import type { MessageFormat, EventCategory } from "shared-types"
import type TranslateEventInput from "./TranslateEventInput"
import type TranslationResult from "./translators/TranslationResult"
import translateEvent from "."

const filenameMappings: Record<MessageFormat, string> = {
  AuditEvent: "audit-event",
  GeneralEvent: "general-event",
  CourtResultInput: "court-result-input",
  HearingOutcomePncUpdate: "hearing-outcome-pnc-update",
  DataSetPncUpdate: "data-set-pnc-update",
  HearingOutcomeInput: "hearing-outcome-input",
  PncUpdateRequest: "pnc-update-request"
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
  expect(event.eventSourceArn).toBe(payload.eventSourceArn)
  expect(event.s3Path).toBe(payload.s3Path)
  expect(event.eventSourceQueueName).toBe(payload.eventSourceQueueName)
})
