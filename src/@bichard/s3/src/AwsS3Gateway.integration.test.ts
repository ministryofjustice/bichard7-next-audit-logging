import "@bichard/testing-jest"
import type { S3 } from "aws-sdk"
import { isError } from "shared"
import AwsS3Gateway from "./AwsS3Gateway"
import type S3Config from "./S3Config"
import TestAwsS3Gateway from "./TestAwsS3Gateway"

const config: S3Config = {
  url: "http://localhost:4566",
  region: "eu-west-2",
  bucketName: "test-bucket"
}
const secondTestGatewayConfig: S3Config = {
  url: "http://localhost:4566",
  region: "eu-west-2",
  bucketName: "second-test-bucket"
}
const testGateway = new TestAwsS3Gateway(config)
const gateway = new AwsS3Gateway(config)
const secondTestGateway = new TestAwsS3Gateway(secondTestGatewayConfig)
const fileName = "2021/04/09/12/06/123456.xml"

describe("AwsS3Gateway", () => {
  beforeAll(async () => {
    await testGateway.createBucket()
    await secondTestGateway.createBucket()
  })

  beforeEach(async () => {
    await testGateway.deleteAll()
    await secondTestGateway.deleteAll()
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

  describe("list()", () => {
    it("should list objects in the bucket", async () => {
      await gateway.upload("2021/04/09/12/06/123456.xml", "Message to be saved")
      await gateway.upload("2021/05/09/12/06/123456.xml", "Message to be saved")
      await gateway.upload("2021/06/09/12/06/123456.xml", "Message to be saved")

      const result = await gateway.list()

      expect(result).toNotBeError()

      const actualObjects = result as S3.ObjectList
      expect(actualObjects).toHaveLength(3)
      expect(actualObjects[0].Key).toBe("2021/04/09/12/06/123456.xml")
      expect(actualObjects[1].Key).toBe("2021/05/09/12/06/123456.xml")
      expect(actualObjects[2].Key).toBe("2021/06/09/12/06/123456.xml")
    })
  })

  describe("deleteItem()", () => {
    it("should delete the object from the bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const objectsBeforeDeletion = (await testGateway.list()) as S3.ObjectList
      expect(objectsBeforeDeletion).toHaveLength(1)
      expect(objectsBeforeDeletion[0].Key).toBe(fileName)

      const result = await gateway.deleteItem(fileName)

      expect(result).toNotBeError()

      const objectsAfterDeletion = (await testGateway.list()) as S3.ObjectList
      expect(objectsAfterDeletion).toHaveLength(0)
    })

    it("should return undefined when object doesn't exist", async () => {
      const result = await gateway.deleteItem(fileName)

      expect(result).toBeUndefined()
    })
  })

  describe("copyItemTo()", () => {
    it("should copy object to another bucket", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const result = await gateway.copyItemTo(fileName, secondTestGatewayConfig.bucketName)

      expect(result).toNotBeError()

      const otherBucketObjects = (await secondTestGateway.list()) as S3.ObjectList
      expect(otherBucketObjects).toHaveLength(1)
      expect(otherBucketObjects[0].Key).toBe(fileName)
    })

    it("should return error if destination bucket doesn't exist", async () => {
      await gateway.upload(fileName, "Message to be saved")

      const result = await gateway.copyItemTo(fileName, "unknown-bucket")

      expect(result).toBeError("The specified bucket does not exist")
    })

    it("should return error if object doesn't exist", async () => {
      const result = await gateway.copyItemTo(fileName, secondTestGatewayConfig.bucketName)

      expect(isError(result)).toBe(true)

      const actualError = result as Error
      expect(actualError.name).toBe("NoSuchKey")
    })
  })
})
