import { GeneralEventLogItem } from "src/types"
import transformGeneralEventLogItem from "./transformGeneralEventLogItem"

const logItem: GeneralEventLogItem = {
  logEvent: {
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
}

test("should transform to AuditLogEvent with matching values", () => {
  const event = transformGeneralEventLogItem(logItem)

  expect(event.eventSource).toBe(logItem.logEvent.componentID)
  expect(event.category).toBe(logItem.logEvent.eventCategory)
  expect(event.timestamp).toBe(logItem.logEvent.eventDateTime)
  expect(event.eventType).toBe(logItem.logEvent.eventType)
  expect(Object.keys(event.attributes)).toHaveLength(2)
  expect(event.attributes.Attribute1).toBe("SomeValue")
  expect(event.attributes.Attribute2).toBe("AnotherValue")
})
