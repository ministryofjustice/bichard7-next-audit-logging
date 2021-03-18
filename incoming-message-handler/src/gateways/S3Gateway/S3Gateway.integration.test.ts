import { isError } from "@handlers/common"
import { S3Config } from "src/configs"
import TestS3Gateway from "./TestS3Gateway"

const config: S3Config = {
  S3_URL: "http://localhost:4566",
  S3_REGION: "eu-west-2",
  S3_FORCE_PATH_STYLE: "true",
  INCOMING_MESSAGE_BUCKET_NAME: "incoming-messages"
}

const gateway = new TestS3Gateway(config)
const fileName = "2021/04/09/12/06/123456.xml"

describe("S3Gateway", () => {
  beforeAll(async () => {
    await gateway.deleteAll()
  })

  describe("getItem()", () => {
    it("should return the contents of a file when it exists in the bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const content = await gateway.getItem(config.INCOMING_MESSAGE_BUCKET_NAME, fileName)

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
