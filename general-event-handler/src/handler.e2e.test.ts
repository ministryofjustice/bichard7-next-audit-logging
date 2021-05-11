import { AuditLog, isError } from "shared"
import AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"
import ApiGateway from "./gateways/ApiGateway"
import getLocalAuditLogApiUrl from "./getLocalAuditLogApiUrl"
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

const getApiGateway = async (): Promise<ApiGateway> => {
  const apiUrl = await getLocalAuditLogApiUrl("http://localhost:4566", "us-east-1")
  process.env.API_URL = apiUrl

  return new ApiGateway(apiUrl)
}

test("should transform the message and attach as an event to an existing AuditLog record", async () => {
  const apiGateway = await getApiGateway()

  const auditLog = new AuditLog("ExternalCorrelationId", new Date(), "XML")
  await apiGateway.createAuditLog(auditLog)

  const message = createMessage(auditLog.messageId)
  const event = createMqEvent([message])

  await handler(event)

  const result = await apiGateway.getMessage(auditLog.messageId)
  expect(isError(result)).toBe(false)

  const actualAuditLog = <AuditLog>result
  expect(actualAuditLog.events).toHaveLength(1)

  const actualEvent = actualAuditLog.events[0]
  expect(actualEvent.category).toBe("warning")
  expect(actualEvent.eventSource).toBe("PNC Access Manager")
  expect(actualEvent.eventType).toBe("PNC Response not received")
  // TODO: Dates aren't working quite right due to timezones and milliseconds. Need to dig into it.
  // expect(actualEvent.timestamp).toBe(expectedTimestamp.toISOString())
  expect(actualEvent.attributes).toBeDefined()
  expect(Object.keys(actualEvent.attributes)).toHaveLength(3)
  expect(actualEvent.attributes["PNC Request Type"]).toBe("ENQASI")
  expect(actualEvent.attributes["Error Message"]).toBe(
    "2021-05-10 10:09:54.471+0000: BCS10023X: JUpicException caught in createProxyConnection(): de.sieme"
  )
  expect(actualEvent.attributes["Error Code"]).toBe("11")
})

test("should throw an error when the referenced AuditLog record does not exist", async () => {
  const message = createMessage("Message1")
  const event = createMqEvent([message])

  let actualError: Error = null

  try {
    await handler(event)
  } catch (error) {
    actualError = error
  }

  expect(actualError).toBeDefined()
  expect(actualError.message).toBe("Request failed with status code 404")
})
