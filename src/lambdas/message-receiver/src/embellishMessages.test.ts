import type AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"
import embellishMessages from "./embellishMessages"
import JmsTextMessage from "./JmsTextMessage"

test("returns all messages with message format attached", () => {
  const expectedMessage1: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message1"
  }

  const expectedMessage2: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message2"
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "",
    messages: [expectedMessage1, expectedMessage2]
  }

  const messages = embellishMessages(event, "AuditEvent")
  expect(messages).toHaveLength(2)

  const actualMessage1 = messages[0]
  expect(actualMessage1.messageData).toBe(expectedMessage1.data)
  expect(actualMessage1.messageFormat).toBe("AuditEvent")

  const actualMessage2 = messages[1]
  expect(actualMessage2.messageData).toBe(expectedMessage2.data)
  expect(actualMessage2.messageFormat).toBe("AuditEvent")
})
