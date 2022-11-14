import { FakeS3Gateway } from "src/shared/testing"
import { AuditLog, AuditLogEvent, isError } from "src/shared/types"
import DeleteMessageObjectsFromS3UseCase from "./DeleteMessageObjectsFromS3UseCase"

const fakeEventsS3Gateway = new FakeS3Gateway()
const fakeMessagesS3Gateway = new FakeS3Gateway()
const useCase = new DeleteMessageObjectsFromS3UseCase(fakeMessagesS3Gateway, fakeEventsS3Gateway)

const createAuditLog = (s3Path: string, eventS3Path: string) => {
  const auditLog = new AuditLog("dummy correlation id", new Date(), "dummy hash")
  auditLog.s3Path = s3Path
  const event = {
    s3Path: eventS3Path,
    ...new AuditLogEvent({
      eventSourceQueueName: "dummy event source queue name",
      eventSource: "dummy event source",
      category: "information",
      eventType: "dummy event type",
      timestamp: new Date()
    })
  } as unknown as AuditLogEvent
  auditLog.events = [event]

  return auditLog
}

beforeEach(() => {
  fakeMessagesS3Gateway.reset()
  fakeEventsS3Gateway.reset()
})

it("should delete message xml from S3 when item exists in S3", async () => {
  const dummyXml = "Xml"
  const s3Path = "Dummy Path 1"
  const eventS3Path = "Dummy Path 2"
  const eventsS3DeleteItemSpy = jest.spyOn(fakeEventsS3Gateway, "deleteItem")
  const messagesS3DeleteItemSpy = jest.spyOn(fakeEventsS3Gateway, "deleteItem")

  fakeMessagesS3Gateway.reset({
    [s3Path]: dummyXml,
    ShouldNotDeleteMessage: dummyXml
  })
  fakeEventsS3Gateway.reset({
    [eventS3Path]: dummyXml,
    ShouldNotDeleteEvent: dummyXml
  })

  const auditLog = createAuditLog(s3Path, eventS3Path)
  const result = await useCase.call(auditLog)

  expect(result).toNotBeError()
  expect(eventsS3DeleteItemSpy).toHaveBeenCalledTimes(1)
  expect(messagesS3DeleteItemSpy).toHaveBeenCalledTimes(1)
  expect(Object.keys(fakeMessagesS3Gateway.items)).toHaveLength(1)
  expect(Object.keys(fakeEventsS3Gateway.items)).toHaveLength(1)
  expect(fakeMessagesS3Gateway.items.ShouldNotDeleteMessage).toBeDefined()
  expect(fakeEventsS3Gateway.items.ShouldNotDeleteEvent).toBeDefined()
})

it("should return error when an S3 gateway (Messages) returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeMessagesS3Gateway.shouldReturnError(expectedError)
  const auditLog = createAuditLog("dummy", "dummy")
  const result = await useCase.call(auditLog)

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})

it("should return error when an S3 gateway (Events) returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeMessagesS3Gateway.reset({ dummy: "dummy" })
  fakeEventsS3Gateway.shouldReturnError(expectedError)
  const auditLog = createAuditLog("dummy", "dummy")
  const result = await useCase.call(auditLog)

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
