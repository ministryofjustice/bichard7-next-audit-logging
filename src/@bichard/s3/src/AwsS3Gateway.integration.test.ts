import "@bichard-testing/jest"
import AwsS3Gateway from "./AwsS3Gateway"
import type S3Config from "./S3Config"
import TestAwsS3Gateway from "./TestAwsS3Gateway"

const config: S3Config = {
  url: "http://localhost:4566",
  region: "eu-west-2",
  bucketName: "test-bucket"
}
const testGateway = new TestAwsS3Gateway(config)
const gateway = new AwsS3Gateway(config)
const fileName = "2021/04/09/12/06/123456.xml"

describe("AwsS3Gateway", () => {
  beforeAll(async () => {
    await testGateway.createBucket()
    await testGateway.deleteAll()
  })

  describe("getItem()", () => {
    it("should return the contents of a file when it exists in the bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const content = await gateway.getItem(fileName)

      expect(content).toBe("Message to be saved")
    })
  })

  describe("upload()", () => {
    it("should save the message in the bucket", async () => {
      const result = await gateway.upload(fileName, "Message to be saved")

      expect(result).toNotBeError()
      expect(result).toBeUndefined()
    })
  })
})
