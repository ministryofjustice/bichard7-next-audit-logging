import type { AmazonMqEventSourceRecordEvent, JmsTextMessage } from "shared"
import embellishMessages from "./embellishMessages"

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
    eventSourceArn: "DummyArn",
    messages: [expectedMessage1, expectedMessage2]
  }

  const messages = embellishMessages(event, "AuditEvent")
  expect(messages).toHaveLength(2)

  const actualMessage1 = messages[0]
  expect(actualMessage1.messageData).toBe(expectedMessage1.data)
  expect(actualMessage1.messageFormat).toBe("AuditEvent")
  expect(actualMessage1.eventSourceArn).toBe("DummyArn")

  const actualMessage2 = messages[1]
  expect(actualMessage2.messageData).toBe(expectedMessage2.data)
  expect(actualMessage2.messageFormat).toBe("AuditEvent")
  expect(actualMessage2.eventSourceArn).toBe("DummyArn")
})
