import { FakeS3Gateway } from "src/shared/testing"
import DoesS3ObjectExist from "./DoesS3ObjectExist"

const fakeGateway = new FakeS3Gateway()
const useCase = new DoesS3ObjectExist(fakeGateway)

describe("Check if an event object key exists in S3 bucket end-to-end", () => {
  it("should return error when gateway returns error", async () => {
    const error = new Error("Dummy error")
    fakeGateway.shouldReturnError(error)

    const payload = {
      id: "step-execution-unique-id",
      detail: {
        requestParameters: {
          key: "dummy-s3-key",
          bucketName: "dummy-bucket"
        }
      }
    }

    const result = await useCase.execute(payload)
    expect(result).toBeError("Dummy error")
  })
})
