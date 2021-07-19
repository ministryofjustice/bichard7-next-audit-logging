import type { EventDetails } from "src/types"
import transformGeneralEventLogItem from "./transformGeneralEventLogItem"

const eventDetails: EventDetails = {
  componentID: "componentID",
  correlationID: "correlationID",
  eventCategory: "warning",
  eventDateTime: new Date().toISOString(),
  eventType: "eventType",
  systemID: "BR7",
  nameValuePairs: {
    nameValuePair: [
      {
        name: "Attribute1",
        value: "SomeValue"
      },
      {
        name: "Attribute2",
        value: "AnotherValue"
      }
    ]
  }
}

test("should transform to AuditLogEvent with matching values", () => {
  const event = transformGeneralEventLogItem(eventDetails)

  expect(event.eventSource).toBe(eventDetails.componentID)
  expect(event.category).toBe(eventDetails.eventCategory)
  expect(event.timestamp).toBe(eventDetails.eventDateTime)
  expect(event.eventType).toBe(eventDetails.eventType)
  expect(Object.keys(event.attributes)).toHaveLength(2)
  expect(event.attributes.Attribute1).toBe("SomeValue")
  expect(event.attributes.Attribute2).toBe("AnotherValue")
})

test("should transform to AuditLogEvent with matching values when nameValuePairs does not exist", () => {
  const actualEvent = { ...eventDetails }
  delete actualEvent.nameValuePairs

  const event = transformGeneralEventLogItem(actualEvent)

  expect(event.eventSource).toBe(eventDetails.componentID)
  expect(event.category).toBe(eventDetails.eventCategory)
  expect(event.timestamp).toBe(eventDetails.eventDateTime)
  expect(event.eventType).toBe(eventDetails.eventType)
  expect(Object.keys(event.attributes)).toHaveLength(0)
})
