import { auditLogEventsS3Config, setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import type { EventMessage } from "shared-types"
import { TestS3Gateway } from "shared"
import type { EventInput } from "../types"
import RetrieveEventFromS3UseCase from "./RetrieveEventFromS3UseCase"

const bucketName = "auditLogEventsBucket"

const gateway = new TestS3Gateway(auditLogEventsS3Config)
const useCase = new RetrieveEventFromS3UseCase(gateway)

describe("Retrieve event from S3 end-to-end", () => {
  beforeEach(async () => {
    await gateway.deleteAll()
  })

  test("given an event is stored in S3", async () => {
    const s3ObjectKey = "dummy-event.json"
    const S3ObjectContent = JSON.stringify(<EventMessage>{
      messageData: "DummyData",
      messageFormat: "AuditEvent",
      eventSourceArn: "DummyArn",
      eventSourceQueueName: "DummyQueueName"
    })
    await gateway.upload(s3ObjectKey, S3ObjectContent)

    const payload = {
      id: "step-execution-unique-id",
      detail: {
        requestParameters: {
          key: s3ObjectKey,
          bucketName
        }
      }
    }

    const result = await useCase.execute(payload)
    expect(result).toNotBeError()

    const { messageData, messageFormat, s3Path } = <EventInput>result
    expect(messageData).toBe(messageData)
    expect(messageFormat).toBe(messageFormat)
    expect(s3Path).toBe(s3ObjectKey)
  })
})
