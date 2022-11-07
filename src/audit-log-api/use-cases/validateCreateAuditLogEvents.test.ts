import type { BichardAuditLogEvent, EventCategory } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
import validateCreateAuditLogEvents from "./validateCreateAuditLogEvents"

it("should be valid when a single audit log event is valid", () => {
  const event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(eventValidationResults.map((r) => r.errors).flat()).toHaveLength(0)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)

  const auditLogEvent = eventValidationResults[0].auditLogEvent
  expect(auditLogEvent).toBeDefined()
  expect(auditLogEvent.category).toBe(event.category)
  expect(auditLogEvent.eventSource).toBe(event.eventSource)
  expect(auditLogEvent.eventType).toBe(event.eventType)
  expect(auditLogEvent.timestamp).toBe(event.timestamp)
  expect(auditLogEvent.attributes).toEqual({})
})

it("should be valid and set attributes when a single audit log is undefined", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })

  event = { ...event, attributes: undefined } as unknown as AuditLogEvent

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(eventValidationResults.map((r) => r.errors).flat()).toHaveLength(0)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)
  expect(eventValidationResults[0].auditLogEvent.attributes).toEqual({})
})

it("should remove arbitrary keys from a single audit log event", () => {
  let event = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })
  event = { ...event, customKey1: "Value", myKey: { anotherKey: 5 } } as unknown as AuditLogEvent

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(eventValidationResults.map((r) => r.errors).flat()).toHaveLength(0)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)

  const auditLogEvent = eventValidationResults[0].auditLogEvent
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

it("should be invalid when a single audit log event is missing all fields", () => {
  const event = {} as AuditLogEvent

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toStrictEqual([
    {
      timestamp: "No event timestamp given",
      errors: [
        "Category is mandatory",
        "Event source is mandatory",
        "Event type is mandatory",
        "Timestamp is mandatory"
      ],
      auditLogEvent: { attributes: {} }
    }
  ])
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

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)

  const errors = eventValidationResults[0].errors
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

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)
  expect(eventValidationResults[0].errors).toStrictEqual(["Category can be either information, error, or warning"])
})

it("should attribute validation errors to the correct event", () => {
  const validEvent = new AuditLogEvent({
    category: "information",
    eventSource: "Event source",
    eventType: "Event type",
    timestamp: new Date("2021-10-05T15:12:13.000Z")
  })
  const invalidEvent = {} as AuditLogEvent

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([validEvent, invalidEvent])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(2)
  expect(eventValidationResults[0]).toEqual({
    timestamp: validEvent.timestamp,
    errors: [],
    auditLogEvent: validEvent
  })
  expect(eventValidationResults[1]).toEqual({
    timestamp: "No event timestamp given",
    errors: ["Category is mandatory", "Event source is mandatory", "Event type is mandatory", "Timestamp is mandatory"],
    auditLogEvent: { attributes: {} }
  })
})
