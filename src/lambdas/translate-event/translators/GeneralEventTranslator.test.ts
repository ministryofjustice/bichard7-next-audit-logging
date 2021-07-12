import fs from "fs"
import { encodeBase64, isError } from "shared"
import type { AuditLogEvent } from "shared"
import GeneralEventTranslator from "./GeneralEventTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const generalEventData = fs.readFileSync("../../../events/general-event.xml")
  const messageData = encodeBase64(generalEventData.toString())
  const result = await GeneralEventTranslator(messageData)

  expect(isError(result)).toBe(false)

  const { category, eventSource, eventType, timestamp } = <AuditLogEvent>result
  expect(category).toBe("information")
  expect(eventSource).toBe("Hearing Outcome Publication Choreography")
  expect(eventType).toBe("Message Received")
  expect(timestamp).toBe("2021-06-29T08:35:36.031Z")
})
