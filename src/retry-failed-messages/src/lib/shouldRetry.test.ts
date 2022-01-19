process.env.API_URL = "dummy"
process.env.API_KEY = "dummy"
import shouldRetry from "./shouldRetry"
import { mockAuditLog, mockAuditLogEvent } from "shared-testing"

describe("shouldRetry", () => {
  it("should not retry new messages too early", () => {
    const receivedDate = new Date(Date.now() - 1799)
    const message = mockAuditLog(receivedDate)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("should correctly retry new messages after an initial wait", () => {
    const receivedDate = new Date(Date.now() - 1801)
    const message = mockAuditLog(receivedDate)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("should correctly handle messages that have already been retried", () => {
    const message = mockAuditLog()
    const event = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 86401))
    message.events.push(event)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("shouldn't retry messages too often that have already been retried", () => {
    const receivedDate = new Date()
    const message = mockAuditLog(receivedDate)
    const event = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 86399))
    message.events.push(event)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("shouldn't retry messages too many times", () => {
    const receivedDate = new Date()
    const message = mockAuditLog(receivedDate)
    const event1 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 186401))
    const event2 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 286401))
    const event3 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 386401))
    message.events.push(event1)
    message.events.push(event2)
    message.events.push(event3)
    expect(shouldRetry(message)).toBeFalsy()
  })
})
