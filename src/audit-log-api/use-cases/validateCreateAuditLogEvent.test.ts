import type { EventCategory } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
import validateCreateAuditLogEvent from "./validateCreateAuditLogEvent"

it("should be valid when audit log event is valid", () => {
  const event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  const { isValid, errors, auditLogEvent } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvent).toBeDefined()

  expect(auditLogEvent.category).toBe(event.category)
  expect(auditLogEvent.eventSource).toBe(event.eventSource)
  expect(auditLogEvent.eventType).toBe(event.eventType)
  expect(auditLogEvent.timestamp).toBe(event.timestamp)
  expect(auditLogEvent.attributes).toEqual({})
})

it("should be valid and set attributes when it is undefined", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  event = { ...event, attributes: undefined } as unknown as AuditLogEvent

  const { isValid, errors, auditLogEvent } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvent).toBeDefined()
  expect(auditLogEvent.attributes).toEqual({})
})

it("should remove arbitrary keys from the audit log event", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })
  event = { ...event, customKey1: "Value", myKey: { anotherKey: 5 } } as unknown as AuditLogEvent

  const { isValid, errors, auditLogEvent } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvent).toBeDefined()

  expect(auditLogEvent.category).toBe(event.category)
  expect(auditLogEvent.eventSource).toBe(event.eventSource)
  expect(auditLogEvent.eventType).toBe(event.eventType)
  expect(auditLogEvent.timestamp).toBe(event.timestamp)
  expect(auditLogEvent.attributes).toEqual({})

  const keys = Object.keys(auditLogEvent)
  expect(keys).not.toContain("customKey1")
  expect(keys).not.toContain("myKey")
})

it("should be invalid when audit log event is missing all fields", () => {
  const event = {} as AuditLogEvent

  const { isValid, errors } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(4)
  expect(errors).toContain("Category is mandatory")
  expect(errors).toContain("Event source is mandatory")
  expect(errors).toContain("Event type is mandatory")
  expect(errors).toContain("Timestamp is mandatory")
})

it("should be invalid when audit log event fields have incorrect format", () => {
  const event = {
    attributes: "attributes",
    category: 1,
    eventSource: 2,
    eventSourceQueueName: 4,
    eventType: 5,
    eventXml: 6,
    timestamp: "2021-10-05 12:13:14"
  } as unknown as AuditLogEvent

  const { isValid, errors } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(7)
  expect(errors).toContain("Attributes must be key/value object")
  expect(errors).toContain("Category can be either information, error, or warning")
  expect(errors).toContain("Event source must be string")
  expect(errors).toContain("Event source queue name must be string")
  expect(errors).toContain("Event type must be string")
  expect(errors).toContain("Event XML must be string")
  expect(errors).toContain("Timestamp must be ISO format")
})

it("should be invalid when audit log event category is invalid", () => {
  const event = new AuditLogEvent({
    category: "invalid category" as EventCategory,
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  const { isValid, errors } = validateCreateAuditLogEvent(event)

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toBe("Category can be either information, error, or warning")
})
