/* eslint-disable @typescript-eslint/no-non-null-assertion */
jest.retryTimes(10)
import { isError } from "shared-types"
import TestS3Gateway from "./TestS3Gateway"
import { externalIncomingS3Config } from "shared-testing"

const gateway = new TestS3Gateway(externalIncomingS3Config)
const fileName = "2021/04/09/12/06/123456.xml"

describe("S3Gateway", () => {
  beforeAll(async () => {
    await gateway.createBucket(externalIncomingS3Config.bucketName!)
    await gateway.deleteAll()
  })

  describe("getItem()", () => {
    it("should return the contents of a file when it exists in the bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const content = await gateway.getItem(externalIncomingS3Config.bucketName!, fileName)

      expect(content).toBe("Message to be saved")
    })
  })

  describe("upload()", () => {
    it("should save the message in the bucket", async () => {
      const result = await gateway.upload(fileName, "Message to be saved")

      expect(isError(result)).toBe(false)
      expect(result).toBeUndefined()
    })
  })
})
