import type { AmazonMqEventSourceRecordEvent, EventMessage, JmsTextMessage, MessageFormat } from "src/shared/types"
import formatMessages from "./formatMessages"

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

  const messages = formatMessages(event, "GeneralEvent")
  expect(messages).toHaveLength(2)

  const actualMessage1 = messages[0] as EventMessage
  expect(actualMessage1.messageData).toBe(expectedMessage1.data)
  expect(actualMessage1.messageFormat).toBe("GeneralEvent")
  expect(actualMessage1.eventSourceArn).toBe("DummyArn")
  expect(actualMessage1.eventSourceQueueName).toBe("DUMMY_QUEUE_1")

  const actualMessage2 = messages[1] as EventMessage
  expect(actualMessage2.messageData).toBe(expectedMessage2.data)
  expect(actualMessage2.messageFormat).toBe("GeneralEvent")
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

  const messages = formatMessages(event, "GeneralEvent")
  expect(messages).toHaveLength(1)

  const actualMessage = messages[0] as EventMessage
  expect(actualMessage.messageData).toBe(expectedMessage.data)
  expect(actualMessage.messageFormat).toBe("GeneralEvent")
  expect(actualMessage.eventSourceArn).toBe("DummyArn")
  expect(actualMessage.eventSourceQueueName).toBe("DUMMY_QUEUE")
})

test("defaults to annotating with MQ details for an unknown MessageFormat", () => {
  const expectedMessage: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "Message1",
    destination: {
      physicalName: "DUMMY_QUEUE_1"
    }
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "DummyArn",
    messages: [expectedMessage]
  }

  const messages = formatMessages(event, "UnknownMessageFormat" as MessageFormat)
  expect(messages).toHaveLength(1)

  const actualMessage1 = messages[0] as EventMessage
  expect(actualMessage1.messageData).toBe(expectedMessage.data)
  expect(actualMessage1.messageFormat).toBe("UnknownMessageFormat")
  expect(actualMessage1.eventSourceArn).toBe("DummyArn")
  expect(actualMessage1.eventSourceQueueName).toBe("DUMMY_QUEUE_1")
})

test("decodes ProcessingValidation messages", () => {
  const expectedMessage: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "eyJrZXkiOiJ2YWx1ZSJ9",
    destination: {
      physicalName: "PROCESSING_VALIDATION"
    }
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "DummyArn",
    messages: [expectedMessage]
  }

  const messages = formatMessages(event, "ProcessingValidation")
  expect(messages).toStrictEqual([
    {
      key: "value"
    }
  ])
})

test("decodes ProcessingValidation messages containing utf8", () => {
  const expectedMessage: JmsTextMessage = {
    messageID: "",
    messageType: "",
    data: "eyJrZXkiOiAidGhpcyBjb250YWlucyBhIOKAmHV0Zi044oCZIHZhbHVlIn0=",
    destination: {
      physicalName: "PROCESSING_VALIDATION"
    }
  }

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "DummyArn",
    messages: [expectedMessage]
  }

  const messages = formatMessages(event, "ProcessingValidation")
  expect(messages).toStrictEqual([
    {
      key: "this contains a ‘utf-8’ value"
    }
  ])
})
