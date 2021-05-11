import { v4 as uuid } from "uuid"
import parseGeneralEventLogItem from "./parseGeneralEventLogItem"

const correlationId = uuid()
const eventDateTime = "2021-05-10T10:09:54.477+00:00"
const xml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <logEvent xmlns="http://www.example.org/GeneralEventLogMessage" xmlns:ds="http://schemas.cjse.gov.uk/datastandards/2006-10" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <systemID>BR7</systemID>
    <componentID>PNC Access Manager</componentID>
    <eventCategory>warning</eventCategory>
    <eventType>PNC Response not received</eventType>
    <correlationID>${correlationId}</correlationID>
    <eventDateTime>${eventDateTime}</eventDateTime>
    <nameValuePairs>
        <nameValuePair>
          <name>PNC Request Type</name>
          <value>ENQASI</value>
        </nameValuePair>
        <nameValuePair>
          <name>Error Message</name>
          <value>2021-05-10 10:09:54.471+0000: BCS10023X: JUpicException caught in createProxyConnection(): de.sieme</value>
        </nameValuePair>
        <nameValuePair>
          <name>Error Code</name>
          <value>11</value>
        </nameValuePair>
    </nameValuePairs>
  </logEvent>
`

test("should parse the values correctly", async () => {
  const item = await parseGeneralEventLogItem(xml)

  expect(item).toBeDefined()
  expect(item.logEvent).toBeDefined()
  expect(item.logEvent.componentID).toBe("PNC Access Manager")
  expect(item.logEvent.correlationID).toBe(correlationId)
  expect(item.logEvent.eventCategory).toBe("warning")
  expect(item.logEvent.eventDateTime).toBe(eventDateTime)
  expect(item.logEvent.eventType).toBe("PNC Response not received")
  expect(item.logEvent.systemID).toBe("BR7")

  const attributes = item.logEvent.nameValuePairs.nameValuePair
  expect(attributes).toHaveLength(3)

  const attribute1 = attributes[0]
  expect(attribute1.name).toBe("PNC Request Type")
  expect(attribute1.value).toBe("ENQASI")

  const attribute2 = attributes[1]
  expect(attribute2.name).toBe("Error Message")
  expect(attribute2.value).toBe(
    "2021-05-10 10:09:54.471+0000: BCS10023X: JUpicException caught in createProxyConnection(): de.sieme"
  )

  const attribute3 = attributes[2]
  expect(attribute3.name).toBe("Error Code")
  expect(attribute3.value).toBe("11")
})
