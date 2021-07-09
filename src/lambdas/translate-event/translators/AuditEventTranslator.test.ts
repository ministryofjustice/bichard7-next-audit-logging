import fs from "fs"
import { encodeBase64, isError } from "shared"
import type { AuditLogEvent } from "shared"
import AuditEventTranslator from "./AuditEventTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const auditEventData = fs.readFileSync("../../../events/audit-event.xml")
  const messageData = encodeBase64(auditEventData.toString())
  const result = await AuditEventTranslator(messageData)

  expect(isError(result)).toBe(false)

  const { category, eventSource, eventType, timestamp } = <AuditLogEvent>result
  expect(category).toBe("warning")
  expect(eventSource).toBe("ErrorHandlerScreenFlow")
  expect(eventType).toBe("Trigger Instances resolved")
  expect(timestamp).toBe("2021-06-29T08:34:22.789Z")
})
