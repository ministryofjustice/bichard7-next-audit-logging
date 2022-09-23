import type { BichardAuditLogEvent, EventCategory } from "shared-types"
import { AuditLogEvent } from "shared-types"
import validateCreateAuditLogEvents from "./validateCreateAuditLogEvents"

it("should be valid when a single audit log event is valid", () => {
  const event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  const { isValid, errors, auditLogEvents } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvents).toBeDefined()
  expect(auditLogEvents).toHaveLength(1)

  expect(auditLogEvents[0].category).toBe(event.category)
  expect(auditLogEvents[0].eventSource).toBe(event.eventSource)
  expect(auditLogEvents[0].eventType).toBe(event.eventType)
  expect(auditLogEvents[0].timestamp).toBe(event.timestamp)
  expect(auditLogEvents[0].attributes).toEqual({})
})

it("should be valid and set attributes when a single audit log is undefined", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  event = { ...event, attributes: undefined } as unknown as AuditLogEvent

  const { isValid, errors, auditLogEvents } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvents).toBeDefined()
  expect(auditLogEvents).toHaveLength(1)
  expect(auditLogEvents[0].attributes).toEqual({})
})

it("should remove arbitrary keys from a single audit log event", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })
  event = { ...event, customKey1: "Value", myKey: { anotherKey: 5 } } as unknown as AuditLogEvent

  const { isValid, errors, auditLogEvents } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)
  expect(auditLogEvents).toBeDefined()
  expect(auditLogEvents).toHaveLength(1)

  expect(auditLogEvents[0].category).toBe(event.category)
  expect(auditLogEvents[0].eventSource).toBe(event.eventSource)
  expect(auditLogEvents[0].eventType).toBe(event.eventType)
  expect(auditLogEvents[0].timestamp).toBe(event.timestamp)
  expect(auditLogEvents[0].attributes).toEqual({})

  const keys = Object.keys(auditLogEvents[0])
  expect(keys).not.toContain("customKey1")
  expect(keys).not.toContain("myKey")
})

it("should be invalid when a single audit log event is missing all fields", () => {
  const event = {} as AuditLogEvent

  const { isValid, errors } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(4)
  expect(errors).toContain("Category is mandatory")
  expect(errors).toContain("Event source is mandatory")
  expect(errors).toContain("Event type is mandatory")
  expect(errors).toContain("Timestamp is mandatory")
})

it("should be invalid when a single audit log event fields have incorrect format", () => {
  const event = {
    attributes: "attributes",
    category: 1,
    eventSource: 2,
    eventSourceArn: 3,
    eventSourceQueueName: 4,
    eventType: 5,
    eventXml: 6,
    timestamp: "2021-10-05 12:13:14"
  } as unknown as BichardAuditLogEvent

  const { isValid, errors } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(8)
  expect(errors).toContain("Attributes must be key/value object")
  expect(errors).toContain("Category can be either information, error, or warning")
  expect(errors).toContain("Event source must be string")
  expect(errors).toContain("event source ARN must be string")
  expect(errors).toContain("Event source queue name must be string")
  expect(errors).toContain("Event type must be string")
  expect(errors).toContain("Event XML must be string")
  expect(errors).toContain("Timestamp must be ISO format")
})

it("should be invalid when a single audit log event category is invalid", () => {
  const event = new AuditLogEvent({
    category: "invalid category" as EventCategory,
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  const { isValid, errors } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toBe("Category can be either information, error, or warning")
})
