process.env.API_URL = "dummy"
process.env.API_KEY = "dummy"
import { mockAuditLogEvent, mockOutputApiAuditLog } from "src/shared/testing"
import shouldRetry from "./shouldRetry"

const generateDateInThePast = (hours: number, minutes: number, seconds: number) =>
  new Date(Date.now() - hours * 3_600_000 - minutes * 60_000 - seconds * 1_000)

const lessThanInitialRetryDelay = generateDateInThePast(0, 29, 59)
const moreThanInitialRetryDelay = generateDateInThePast(0, 30, 1)
const lessThanRetryDelay = generateDateInThePast(23, 59, 59)
const moreThanRetryDelay = generateDateInThePast(24, 0, 1)

describe("shouldRetry", () => {
  it("should not retry new messages too early", () => {
    const receivedDate = lessThanInitialRetryDelay.toISOString()
    const message = mockOutputApiAuditLog({ receivedDate })
    const event = mockAuditLogEvent({
      category: "error",
      eventType: "Failed event",
      timestamp: lessThanInitialRetryDelay
    })
    message.events.push(event)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("should correctly retry new messages after an initial wait", () => {
    const receivedDate = moreThanInitialRetryDelay.toISOString()
    const message = mockOutputApiAuditLog({ receivedDate })
    const event = mockAuditLogEvent({
      category: "error",
      eventType: "Failed event",
      timestamp: moreThanInitialRetryDelay
    })
    message.events.push(event)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("should correctly handle messages that have already been retried", () => {
    const message = mockOutputApiAuditLog()
    const errorEvent = mockAuditLogEvent({
      category: "error",
      eventType: "Failed event",
      timestamp: generateDateInThePast(24, 0, 40)
    })
    message.events.push(errorEvent)
    const retryEvent = mockAuditLogEvent({
      category: "information",
      eventType: "Retrying failed message",
      timestamp: moreThanRetryDelay
    })
    message.events.push(retryEvent)
    expect(shouldRetry(message)).toBeTruthy()
  })

  it("shouldn't retry messages too often that have already been retried", () => {
    const receivedDate = new Date().toISOString()
    const message = mockOutputApiAuditLog({ receivedDate })
    const errorEvent = mockAuditLogEvent({
      category: "error",
      eventType: "Failed event",
      timestamp: generateDateInThePast(24, 59, 59)
    })
    message.events.push(errorEvent)
    const retryEvent = mockAuditLogEvent({
      category: "information",
      eventType: "Retrying failed message",
      timestamp: lessThanRetryDelay
    })
    message.events.push(retryEvent)
    expect(shouldRetry(message)).toBeFalsy()
  })

  it("shouldn't retry messages too many times", () => {
    const receivedDate = new Date().toISOString()
    const message = mockOutputApiAuditLog({ receivedDate })
    const errorEvent = mockAuditLogEvent({
      category: "error",
      eventType: "Failed event",
      timestamp: generateDateInThePast(28, 0, 0)
    })
    const retryEvent1 = mockAuditLogEvent({
      category: "information",
      eventType: "Retrying failed message",
      timestamp: generateDateInThePast(27, 0, 0)
    })
    const retryEvent2 = mockAuditLogEvent({
      category: "information",
      eventType: "Retrying failed message",
      timestamp: generateDateInThePast(26, 0, 0)
    })
    const retryEvent3 = mockAuditLogEvent({
      category: "information",
      eventType: "Retrying failed message",
      timestamp: moreThanRetryDelay
    })
    message.events.push(errorEvent)
    message.events.push(retryEvent1)
    message.events.push(retryEvent2)
    message.events.push(retryEvent3)
    expect(shouldRetry(message)).toBeFalsy()
  })
})
