import "shared-testing"
import fs from "fs"
import { encodeBase64 } from "shared"
import type TranslateEventInput from "../TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import DataSetPncUpdateTranslator from "./DataSetPncUpdateTranslator"

test("parses the message data and returns an AuditLogEvent", async () => {
  const eventData = fs.readFileSync("../../../events/data-set-pnc-update.xml")
  const messageData = encodeBase64(eventData.toString())
  const eventInput: TranslateEventInput = {
    messageData,
    s3Path: "DummyPath",
    eventSourceArn: "DummyArn",
    messageFormat: "DataSetPncUpdate",
    eventSourceQueueName: "DummyQueueName"
  }
  const beforeDate = new Date()
  const result = await DataSetPncUpdateTranslator(eventInput)
  expect(result).toNotBeError()
  const afterDate = new Date()

  const { messageId, event } = <TranslationResult>result
  expect(messageId).toBe("{MESSAGE_ID}")
  expect(event.category).toBe("error")
  expect(event.eventSource).toBe("Translate Event")
  expect(event.eventType).toBe("Data Set PNC Update Queue Failure")

  const eventTimestamp = new Date(event.timestamp)
  expect(eventTimestamp).toBeBetween(beforeDate, afterDate)

  expect(event.s3Path).toBe("DummyPath")
  expect(event.eventSourceArn).toBe("DummyArn")
})
