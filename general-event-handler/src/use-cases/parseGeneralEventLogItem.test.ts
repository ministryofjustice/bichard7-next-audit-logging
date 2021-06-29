import { isError } from "shared"
import { EventDetails } from "src/types"
import { v4 as uuid } from "uuid"
import parseGeneralEventLogItem from "./parseGeneralEventLogItem"

const correlationId = uuid()
const timestamp = "2021-05-10T10:09:54.477+00:00"
const xml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <logEvent xmlns="http://www.example.org/GeneralEventLogMessage" xmlns:ds="http://schemas.cjse.gov.uk/datastandards/2006-10" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <systemID>BR7</systemID>
    <componentID>PNC Access Manager</componentID>
    <eventCategory>warning</eventCategory>
    <eventType>PNC Response not received</eventType>
    <correlationID>${correlationId}</correlationID>
    <eventDateTime>${timestamp}</eventDateTime>
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
  const result = await parseGeneralEventLogItem(xml)

  expect(isError(result)).toBe(false)
  expect(result).toBeDefined()

  const { componentID, correlationID, eventCategory, eventDateTime, eventType, systemID, nameValuePairs } = <
    EventDetails
  >result
  expect(componentID).toBe("PNC Access Manager")
  expect(correlationID).toBe(correlationId)
  expect(eventCategory).toBe("warning")
  expect(eventDateTime).toBe(timestamp)
  expect(eventType).toBe("PNC Response not received")
  expect(systemID).toBe("BR7")

  const attributes = nameValuePairs?.nameValuePair
  expect(attributes).toBeDefined()
  expect(attributes).toHaveLength(3)

  const attribute1 = attributes![0]
  expect(attribute1.name).toBe("PNC Request Type")
  expect(attribute1.value).toBe("ENQASI")

  const attribute2 = attributes![1]
  expect(attribute2.name).toBe("Error Message")
  expect(attribute2.value).toBe(
    "2021-05-10 10:09:54.471+0000: BCS10023X: JUpicException caught in createProxyConnection(): de.sieme"
  )

  const attribute3 = attributes![2]
  expect(attribute3.name).toBe("Error Code")
  expect(attribute3.value).toBe("11")
})

test("should throw error when componentID is not set", async () => {
  const actualXml = xml.replace(/<[//]{0,1}(componentID|\/componentID)[^><]*>/g, "")

  const item = await parseGeneralEventLogItem(actualXml).catch((error: Error) => error)

  expect(isError(item)).toBe(true)
  expect((<Error>item).message).toBe("componentID must have value.")
})

test("should throw error when logEvent is not set", async () => {
  const actualXml = xml.replace(/<[//]{0,1}(logEvent|\/logEvent)[^><]*>/g, "")

  const item = await parseGeneralEventLogItem(actualXml).catch((error) => error)

  expect(isError(item)).toBe(true)
  expect((<Error>item).message).toBe("logEvent must have value.")
})

test("should throw error when eventType is not set", async () => {
  const actualXml = xml.replace(/<[//]{0,1}(eventType|\/eventType)[^><]*>/g, "")

  const item = await parseGeneralEventLogItem(actualXml).catch((error) => error)

  expect(isError(item)).toBe(true)
  expect((<Error>item).message).toBe("eventType must have value.")
})

test("should throw error when correlationID is not set", async () => {
  const actualXml = xml.replace(/<[//]{0,1}(correlationID|\/correlationID)[^><]*>/g, "")

  const item = await parseGeneralEventLogItem(actualXml).catch((error) => error)

  expect(isError(item)).toBe(true)
  expect((<Error>item).message).toBe("correlationID must have value.")
})

test("should throw error when eventDateTime is not set", async () => {
  const actualXml = xml.replace(/<[//]{0,1}(eventDateTime|\/eventDateTime)[^><]*>/g, "")

  const item = await parseGeneralEventLogItem(actualXml).catch((error) => error)

  expect(isError(item)).toBe(true)
  expect((<Error>item).message).toBe("eventDateTime must have value.")
})
