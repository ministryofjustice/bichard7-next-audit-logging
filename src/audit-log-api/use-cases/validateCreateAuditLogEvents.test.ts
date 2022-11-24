import { mockApiAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent, EventCategory } from "src/shared/types"
import validateCreateAuditLogEvents from "./validateCreateAuditLogEvents"

it("should be valid when a single audit log event is valid", () => {
  const event = mockApiAuditLogEvent()

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
  expect(auditLogEvent.attributes).toEqual(event.attributes)
})

it("should be valid and set attributes when a single audit log is undefined", () => {
  const event = mockApiAuditLogEvent({ attributes: undefined })
  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(true)
  expect(eventValidationResults.map((r) => r.errors).flat()).toHaveLength(0)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)
  expect(eventValidationResults[0].auditLogEvent.attributes).toEqual({})
})

it("should remove arbitrary keys from a single audit log event", () => {
  let event = mockApiAuditLogEvent()
  event = { ...event, customKey1: "Value", myKey: { anotherKey: 5 } } as unknown as ApiAuditLogEvent

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
  expect(auditLogEvent.attributes).toStrictEqual(event.attributes)

  const keys = Object.keys(auditLogEvent)
  expect(keys).not.toContain("customKey1")
  expect(keys).not.toContain("myKey")
})

it("should be invalid when a single audit log event is missing all fields", () => {
  const event = {} as ApiAuditLogEvent

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
    eventSourceQueueName: 4,
    eventType: 5,
    eventXml: 6,
    timestamp: "2021-10-05 12:13:14"
  } as unknown as ApiAuditLogEvent

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)

  const errors = eventValidationResults[0].errors
  expect(errors).toHaveLength(7)
  expect(errors).toContain("Attributes must be key/value object")
  expect(errors).toContain("Category can be either information, error, or warning")
  expect(errors).toContain("Event source must be string")
  expect(errors).toContain("Event source queue name must be string")
  expect(errors).toContain("Event type must be string")
  expect(errors).toContain("Event XML must be string")
  expect(errors).toContain("Timestamp must be ISO format")
})

it("should be invalid when a single audit log event category is invalid", () => {
  const event = mockApiAuditLogEvent({ category: "invalid category" as EventCategory })
  const { isValid, eventValidationResults } = validateCreateAuditLogEvents([event])

  expect(isValid).toBe(false)
  expect(eventValidationResults).toBeDefined()
  expect(eventValidationResults).toHaveLength(1)
  expect(eventValidationResults[0].errors).toStrictEqual(["Category can be either information, error, or warning"])
})

it("should attribute validation errors to the correct event", () => {
  const validEvent = mockApiAuditLogEvent()
  const invalidEvent = {} as ApiAuditLogEvent

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
