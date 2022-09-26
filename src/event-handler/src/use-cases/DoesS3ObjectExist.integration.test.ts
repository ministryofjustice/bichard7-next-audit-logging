import { auditLogEventsS3Config, setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import type { EventMessage } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import DoesS3ObjectExist from "./DoesS3ObjectExist"

const gateway = new TestAwsS3Gateway(auditLogEventsS3Config)
const useCase = new DoesS3ObjectExist(gateway)

const bucketName = auditLogEventsS3Config.bucketName || "auditLogEventsBucket"

describe("Check if an event object key exists in S3 bucket end-to-end", () => {
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
    expect(result).toBe(true)
  })

  test("given an event is not stored in S3", async () => {
    const s3ObjectKey = "dummy-non-existent-event.json"

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
    expect(result).toBe(false)
  })
})
