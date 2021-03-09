import { isError } from "@handlers/common"
import { S3Config } from "../../types"
import { getFileName } from "../../utils/file"
import TestS3Gateway from "./TestS3Gateway"

const config: S3Config = {
  S3_URL: "http://localhost:4566",
  S3_REGION: "eu-west-2",
  S3_FORCE_PATH_STYLE: "true",
  S3_BUCKET_NAME: "incoming-messages"
}

const gateway = new TestS3Gateway(config)
const fileName = getFileName(new Date(), "123456")

describe("S3Gateway", () => {
  describe("upload", () => {
    describe("success", () => {
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
})
