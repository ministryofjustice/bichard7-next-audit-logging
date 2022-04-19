import { FakeS3Gateway } from "shared-testing"
import { AuditLog, BichardAuditLogEvent, isError } from "shared-types"
import DeleteMessageObjectsFromS3UseCase from "./DeleteMessageObjectsFromS3UseCase"

const fakeS3Gateway = new FakeS3Gateway()
const useCase = new DeleteMessageObjectsFromS3UseCase(fakeS3Gateway)

const createAuditLog = (s3Path: string, eventS3Path: string) => {
  const auditLog = new AuditLog("dummy correlation id", new Date(), "dummy hash")
  auditLog.s3Path = s3Path
  auditLog.events = [
    new BichardAuditLogEvent({
      s3Path: eventS3Path,
      eventSourceArn: "dummy event source arn",
      eventSourceQueueName: "dummy event source queue name",
      eventSource: "dummy event source",
      category: "information",
      eventType: "dummy event type",
      timestamp: new Date()
    })
  ]

  return auditLog
}

it("should delete message xml from S3 when item exists in S3", async () => {
  const dummyXml = "Xml"
  const s3Path = "Dummy Path 1"
  const eventS3Path = "Dummy Path 2"
  const s3DeleteItemSpy = jest.spyOn(fakeS3Gateway, "deleteItem")

  fakeS3Gateway.reset({
    [s3Path]: dummyXml,
    [eventS3Path]: dummyXml,
    ShouldNotDelete: dummyXml
  })

  const auditLog = createAuditLog(s3Path, eventS3Path)
  const result = await useCase.call(auditLog)

  expect(result).toNotBeError()
  expect(s3DeleteItemSpy).toHaveBeenCalledTimes(2)
  expect(Object.keys(fakeS3Gateway.items)).toHaveLength(1)
  expect(fakeS3Gateway.items.ShouldNotDelete).toBeDefined()
})

it("should return error when an S3 gateway returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeS3Gateway.shouldReturnError(expectedError)
  const auditLog = createAuditLog("dummy", "dummy")
  const result = await useCase.call(auditLog)

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
