import format from "xml-formatter"
import { isError } from "shared"
import type JmsTextMessage from "src/types/JmsTextMessage"
import extractMessageXml from "./extractMessageXml"

const formatXml = (xml: string): string => format(xml, { indentation: "  " })

const expectedXml = formatXml(`
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<logEvent xmlns="http://www.example.org/GeneralEventLogMessage" xmlns:ds="http://schemas.cjse.gov.uk/datastandards/2006-10" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <systemID>BR7</systemID>
    <componentID>Hearing Outcome Publication Choreography</componentID>
    <eventCategory>information</eventCategory>
    <eventType>Message Received</eventType>
    <correlationID>d3407fe2-b38d-4cc9-8434-ec58a7f32906</correlationID>
    <eventDateTime>2021-06-23T12:51:13.639+00:00</eventDateTime>
    <nameValuePairs>
        <nameValuePair>
            <name>Requesting System Org Unit Code</name>
            <value>Z000000</value>
        </nameValuePair>
        <nameValuePair>
            <name>Requesting System Name</name>
            <value>CJSE</value>
        </nameValuePair>
        <nameValuePair>
            <name>External Correlation Identifier</name>
            <value>d3407fe2-b38d-4cc9-8434-ec58a7f32906</value>
        </nameValuePair>
    </nameValuePairs>
</logEvent>
`)

test("Expected XML is extracted from JMS Text Message", () => {
  const messageJson = JSON.stringify({
    messageID: "ID:ip-10-0-2-174.eu-west-2.compute.internal-46329-1624350753021-17:1:1:1:1",
    messageType: "jms/text-message",
    timestamp: 1624452673764,
    deliveryMode: 2,
    replyTo: "null",
    destination: { physicalName: "GENERAL_EVENT_QUEUE" },
    redelivered: true,
    expiration: 1624539073764,
    priority: 4,
    data:
      "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/Pgo8bG9nRXZlbnQgeG1sbnM9Imh0dHA6Ly93d3cuZXhhbXBsZS5vcmcvR2VuZXJhbEV2ZW50TG9nTWVzc2FnZSIgeG1sbnM6ZHM9Imh0dHA6Ly9zY2hlbWFzLmNqc2UuZ292LnVrL2RhdGFzdGFuZGFyZHMvMjAwNi0xMCIgeG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZSI+CiAgICA8c3lzdGVtSUQ+QlI3PC9zeXN0ZW1JRD4KICAgIDxjb21wb25lbnRJRD5IZWFyaW5nIE91dGNvbWUgUHVibGljYXRpb24gQ2hvcmVvZ3JhcGh5PC9jb21wb25lbnRJRD4KICAgIDxldmVudENhdGVnb3J5PmluZm9ybWF0aW9uPC9ldmVudENhdGVnb3J5PgogICAgPGV2ZW50VHlwZT5NZXNzYWdlIFJlY2VpdmVkPC9ldmVudFR5cGU+CiAgICA8Y29ycmVsYXRpb25JRD5kMzQwN2ZlMi1iMzhkLTRjYzktODQzNC1lYzU4YTdmMzI5MDY8L2NvcnJlbGF0aW9uSUQ+CiAgICA8ZXZlbnREYXRlVGltZT4yMDIxLTA2LTIzVDEyOjUxOjEzLjYzOSswMDowMDwvZXZlbnREYXRlVGltZT4KICAgIDxuYW1lVmFsdWVQYWlycz4KICAgICAgICA8bmFtZVZhbHVlUGFpcj4KICAgICAgICAgICAgPG5hbWU+UmVxdWVzdGluZyBTeXN0ZW0gT3JnIFVuaXQgQ29kZTwvbmFtZT4KICAgICAgICAgICAgPHZhbHVlPlowMDAwMDA8L3ZhbHVlPgogICAgICAgIDwvbmFtZVZhbHVlUGFpcj4KICAgICAgICA8bmFtZVZhbHVlUGFpcj4KICAgICAgICAgICAgPG5hbWU+UmVxdWVzdGluZyBTeXN0ZW0gTmFtZTwvbmFtZT4KICAgICAgICAgICAgPHZhbHVlPkNKU0U8L3ZhbHVlPgogICAgICAgIDwvbmFtZVZhbHVlUGFpcj4KICAgICAgICA8bmFtZVZhbHVlUGFpcj4KICAgICAgICAgICAgPG5hbWU+RXh0ZXJuYWwgQ29ycmVsYXRpb24gSWRlbnRpZmllcjwvbmFtZT4KICAgICAgICAgICAgPHZhbHVlPmQzNDA3ZmUyLWIzOGQtNGNjOS04NDM0LWVjNThhN2YzMjkwNjwvdmFsdWU+CiAgICAgICAgPC9uYW1lVmFsdWVQYWlyPgogICAgPC9uYW1lVmFsdWVQYWlycz4KPC9sb2dFdmVudD4KCg==",
    brokerInTime: 1624452673764,
    brokerOutTime: 1624452742773
  })

  const message = <JmsTextMessage>JSON.parse(messageJson)
  const actualXml = extractMessageXml(message)

  expect(isError(actualXml)).toBe(false)
  expect(formatXml(<string>actualXml)).toBe(expectedXml)
})
