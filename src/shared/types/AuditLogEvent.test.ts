import { AuditLogEvent } from "."
import type { AuditLogEventOptions } from "."

const defaultOptions: AuditLogEventOptions = {
  eventSource: "test",
  eventType: "test",
  category: "information",
  timestamp: new Date()
}

describe("AuditLogEvent", () => {
  describe("addAttribute", () => {
    it("should add the attribute key and value", () => {
      const value = "x".repeat(10000)
      const log = new AuditLogEvent(defaultOptions)
      log.addAttribute("test", value)
      const attrValue: string = log.attributes.test as string
      expect(attrValue).toEqual(value)
    })
  })
})
