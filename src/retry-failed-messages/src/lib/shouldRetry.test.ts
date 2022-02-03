process.env.API_URL = "dummy"
process.env.API_KEY = "dummy"
import shouldRetry from "./shouldRetry"
import { mockAuditLog, mockAuditLogEvent } from "shared-testing"

describe("shouldRetry", () => {
  it("should not retry new messages too early", () => {
    const receivedDate = new Date(Date.now() - 1799000)
    const message = mockAuditLog(receivedDate)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("should correctly retry new messages after an initial wait", () => {
    const receivedDate = new Date(Date.now() - 1801000)
    const message = mockAuditLog(receivedDate)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("should correctly handle messages that have already been retried", () => {
    const message = mockAuditLog()
    const event = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 86401000))
    message.events.push(event)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("shouldn't retry messages too often that have already been retried", () => {
    const receivedDate = new Date()
    const message = mockAuditLog(receivedDate)
    const event = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 86399000))
    message.events.push(event)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("shouldn't retry messages too many times", () => {
    const receivedDate = new Date()
    const message = mockAuditLog(receivedDate)
    const event1 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 186401000))
    const event2 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 286401000))
    const event3 = mockAuditLogEvent("information", "Retrying failed message", new Date(Date.now() - 386401000))
    message.events.push(event1)
    message.events.push(event2)
    message.events.push(event3)
    expect(shouldRetry(message)).toBeFalsy()
  })
})
