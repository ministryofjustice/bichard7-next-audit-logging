import { AuditLog } from "."

describe("AuditLog", () => {
  describe("constructor", () => {
    it("should populate the sanitisation fields", () => {
      const auditLog = new AuditLog("externalCorrelationId", new Date("2021-01-01T00:00:00"), "messageHash")
      expect(auditLog.isSanitised).toBe(0)
      expect(auditLog.lastSanitiseCheck).toBe("1970-01-01T00:00:00Z")
    })
  })
})
