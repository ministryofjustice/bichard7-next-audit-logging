jest.setTimeout(30000)

import "shared-testing"
import type { S3 } from "aws-sdk"
import type { S3Config } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import { invokeFunction } from "shared-testing"
import type { TransferMessagesInput, TransferMessagesResult } from "./types"

const internalGatewayConfig: S3Config = {
  url: "http://localhost:4566",
  region: "us-east-1",
  bucketName: "incoming-messages"
}

const externalGatewayConfig: S3Config = {
  url: "http://localhost:4566",
  region: "us-east-1",
  bucketName: "external-incoming-messages"
}

const internalGateway = new TestAwsS3Gateway(internalGatewayConfig)
const externalGateway = new TestAwsS3Gateway(externalGatewayConfig)

describe("Transfer Messages end-to-end", () => {
  beforeAll(async () => {
    await internalGateway.createBucket(true)
    await externalGateway.createBucket(true)
  })

  beforeEach(async () => {
    await internalGateway.deleteAll()
    await externalGateway.deleteAll()
  })

  test("given an object is stored in external S3 bucket, it should be transferred to the internal S3 bucket", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const result = await invokeFunction<TransferMessagesInput, TransferMessagesResult>("transfer-messages", {
      numberOfObjectsToTransfer: "all"
    })
    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = <TransferMessagesResult>result
    expect(successful).toHaveLength(1)
    expect(failedToCopy).toHaveLength(0)
    expect(failedToDelete).toHaveLength(0)

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(0)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(1)
    expect(internalBucketObjects[0].Key).toBe(fileName)
  })

  it("should return error when numberOfObjectsToTransfer parameter is not provided", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const result = await invokeFunction<TransferMessagesInput, TransferMessagesResult>(
      "transfer-messages",
      {} as TransferMessagesInput
    )

    expect(String(result)).toContain("Provided numberOfObjectsToTransfer is invalid")

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)
  })

  it("should return error when numberOfObjectsToTransfer parameter is invalid", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const result = await invokeFunction<TransferMessagesInput, TransferMessagesResult>("transfer-messages", {
      numberOfObjectsToTransfer: "invalid value"
    } as TransferMessagesInput)

    expect(String(result)).toContain("Provided numberOfObjectsToTransfer is invalid")

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)
  })
})
