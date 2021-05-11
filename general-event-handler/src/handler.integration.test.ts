import AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"
import handler from "./handler"

const createMessage = (correlationId: string): string => {
  const eventDateTime = new Date().toISOString()

  return `
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
}

const createMqEvent = (messages: string[]): AmazonMqEventSourceRecordEvent => {
  return {
    eventSource: "aws:amq",
    eventSourceArn: "ARN",
    messages
  }
}

test("should send a single message to the API", async () => {
  const message = createMessage("Message1")
  const event = createMqEvent([message])

  await handler(event)

  // TODO: What can we assert here?
})
