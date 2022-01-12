import "shared-testing"
import { setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import type { S3 } from "aws-sdk"
import type { S3Config } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import type { TransferMessagesInput, TransferMessagesResult } from "./types"

const internalGatewayConfig: S3Config = {
  url: 'http://localhost:4569',
  region: 'eu-west-2',
  bucketName: 'internalIncomingBucket',
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER'
}

const externalGatewayConfig: S3Config = {
  url: 'http://localhost:4569',
  region: 'eu-west-2',
  bucketName: 'externalIncomingBucket',
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER'
}

process.env.EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME = externalGatewayConfig.bucketName
process.env.INTERNAL_INCOMING_MESSAGE_BUCKET_NAME = internalGatewayConfig.bucketName

import transferMessages from "."

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  })

  test("given an object is stored in external S3 bucket, it should be transferred to the internal S3 bucket", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const result = await transferMessages({
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

  it("should throw error when numberOfObjectsToTransfer parameter is not provided", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const lambda = async () => await transferMessages({} as TransferMessagesInput)
    await expect(lambda).rejects.toThrowError("Provided numberOfObjectsToTransfer is invalid")

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)
  })

  it("should throw error when numberOfObjectsToTransfer parameter is invalid", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    const lambda = () => transferMessages({
      numberOfObjectsToTransfer: "invalid value"
    } as TransferMessagesInput)
    await expect(lambda).rejects.toThrowError("Provided numberOfObjectsToTransfer is invalid")

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)
  })
})
