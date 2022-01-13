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
    it("should truncate the attribute if the text is too long", () => {
      const value = "x".repeat(2000)
      const log = new AuditLogEvent(defaultOptions)
      log.addAttribute("test", value)
      const attrValue: string = log.attributes.test as string
      expect(attrValue).toHaveLength(1000)
      expect(attrValue.endsWith("xxx...[truncated]")).toBeTruthy()
    })

    it("should not truncate the attribute if the text is not too long", () => {
      const value = "x".repeat(1000)
      const log = new AuditLogEvent(defaultOptions)
      log.addAttribute("test", value)
      const attrValue: string = log.attributes.test as string
      expect(attrValue).toHaveLength(1000)
      expect(attrValue).toEqual(value)
    })

    it("should only try to truncate if the value is a string", () => {
      const value = 999
      const log = new AuditLogEvent(defaultOptions)
      log.addAttribute("test", value)
      expect(log.attributes.test).toEqual(value)
    })
  })
})
