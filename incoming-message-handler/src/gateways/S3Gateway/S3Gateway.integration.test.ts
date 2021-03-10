import { isError } from "@handlers/common"
import { S3Config } from "../../configs"
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
  describe("upload", () => {
    beforeAll(async () => {
      await gateway.deleteAll()
    })

    it("should save the message in the bucket", async () => {
      const result = await gateway.upload(fileName, "Message to be saved")

      expect(isError(result)).toBe(false)
      expect(result).toBeUndefined()
    })
  })
})
