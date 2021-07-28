import type { AmazonMqEventSourceRecordEvent, JmsTextMessage } from "shared"
import embellishMessages from "./embellishMessages"

test("returns all messages with message format attached", () => {
  const expectedMessage1: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message1",
    destination: {
      physicalName: "DUMMY_QUEUE_1"
    }
  }

  const expectedMessage2: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message2",
    destination: {
      physicalName: "DUMMY_QUEUE_2"
    }
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "DummyArn",
    messages: [expectedMessage1, expectedMessage2]
  }

  const { messages } = embellishMessages(event, "AuditEvent")
  expect(messages).toHaveLength(2)

  const actualMessage1 = messages[0]
  expect(actualMessage1.messageData).toBe(expectedMessage1.data)
  expect(actualMessage1.messageFormat).toBe("AuditEvent")
  expect(actualMessage1.eventSourceArn).toBe("DummyArn")
  expect(actualMessage1.eventSourceQueueName).toBe("DUMMY_QUEUE_1")

  const actualMessage2 = messages[1]
  expect(actualMessage2.messageData).toBe(expectedMessage2.data)
  expect(actualMessage2.messageFormat).toBe("AuditEvent")
  expect(actualMessage2.eventSourceArn).toBe("DummyArn")
  expect(actualMessage2.eventSourceQueueName).toBe("DUMMY_QUEUE_2")
})

test("returns corrected queue name when message is from failure queue", () => {
  const expectedMessage: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message data",
    destination: {
      physicalName: "DUMMY_QUEUE.FAILURE"
    }
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "DummyArn",
    messages: [expectedMessage]
  }

  const { messages } = embellishMessages(event, "AuditEvent")
  expect(messages).toHaveLength(1)

  const actualMessage = messages[0]
  expect(actualMessage.messageData).toBe(expectedMessage.data)
  expect(actualMessage.messageFormat).toBe("AuditEvent")
  expect(actualMessage.eventSourceArn).toBe("DummyArn")
  expect(actualMessage.eventSourceQueueName).toBe("DUMMY_QUEUE")
})
