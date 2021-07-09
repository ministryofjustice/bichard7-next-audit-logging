/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isError } from "../types"
import S3Config from "./S3Config"
import TestS3Gateway from "./TestS3Gateway"

const config: S3Config = {
  url: "http://localhost:4566",
  region: "eu-west-2",
  bucketName: "test-bucket"
}

const gateway = new TestS3Gateway(config)
const fileName = "2021/04/09/12/06/123456.xml"

describe("S3Gateway", () => {
  beforeAll(async () => {
    await gateway.createBucket(config.bucketName!)
    await gateway.deleteAll()
  })

  describe("getItem()", () => {
    it("should return the contents of a file when it exists in the bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const content = await gateway.getItem(config.bucketName!, fileName)

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