import type { S3 } from "aws-sdk"
import { TestS3Gateway } from "src/shared"
import "src/shared/testing"
import {
  conductorIncomingS3Config,
  externalIncomingS3Config,
  internalIncomingS3Config,
  setEnvironmentVariables
} from "src/shared/testing"
import type { TransferMessagesInput, TransferMessagesResult } from "./types"
setEnvironmentVariables()

process.env.EXTERNAL_INCOMING_MESSAGES_BUCKET = externalIncomingS3Config.bucketName
process.env.INTERNAL_INCOMING_MESSAGES_BUCKET = internalIncomingS3Config.bucketName
process.env.CONDUCTOR_INCOMING_MESSAGES_BUCKET = internalIncomingS3Config.bucketName

import transferMessages from "."
import { Destination } from "./types/TransferMessagesInput"

const internalGateway = new TestS3Gateway(internalIncomingS3Config)
const conductorGateway = new TestS3Gateway(conductorIncomingS3Config)
const externalGateway = new TestS3Gateway(externalIncomingS3Config)

describe("Transfer Messages end-to-end", () => {
  beforeAll(async () => {
    await internalGateway.createBucket(true)
    await conductorGateway.createBucket(true)
    await externalGateway.createBucket(true)
  })

  beforeEach(async () => {
    await internalGateway.deleteAll()
    await conductorGateway.deleteAll()
    await externalGateway.deleteAll()

    process.env.CANARY_RATIO = "0.0"
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

    const lambda = () => transferMessages({} as TransferMessagesInput)
    await expect(lambda).rejects.toThrow("Provided numberOfObjectsToTransfer is invalid")

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

    const lambda = () =>
      transferMessages({
        numberOfObjectsToTransfer: "invalid value"
      } as TransferMessagesInput)
    await expect(lambda).rejects.toThrow("Provided numberOfObjectsToTransfer is invalid")

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)
  })

  it("should deliver messages to the internal gateway if the canary ratio is 0", async () => {
    process.env.CANARY_RATIO = "0.0"

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

    const conductorBucketObjects = (await conductorGateway.list()) as S3.ObjectList
    expect(conductorBucketObjects).toHaveLength(0)
  })

  it("should deliver messages to the conductor gateway if the canary ratio is 1", async () => {
    process.env.CANARY_RATIO = "1.0"

    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let conductorBucketObjects = (await conductorGateway.list()) as S3.ObjectList
    expect(conductorBucketObjects).toHaveLength(0)

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

    const internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    conductorBucketObjects = (await conductorGateway.list()) as S3.ObjectList
    expect(conductorBucketObjects).toHaveLength(1)
    expect(conductorBucketObjects[0].Key).toBe(fileName)
  })

  it.only("should deliver messages to the specified bucket when the destination override is provided", async () => {
    const fileName = "2021/11/18/12/06/123456.xml"
    await externalGateway.upload(fileName, "Dummy content")

    let externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(1)
    expect(externalBucketObjects[0].Key).toBe(fileName)

    let conductorBucketObjects = (await conductorGateway.list()) as S3.ObjectList
    expect(conductorBucketObjects).toHaveLength(0)

    const result = await transferMessages({
      numberOfObjectsToTransfer: "all",
      destinationBucket: Destination.CORE
    })
    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = <TransferMessagesResult>result
    expect(successful).toHaveLength(1)
    expect(failedToCopy).toHaveLength(0)
    expect(failedToDelete).toHaveLength(0)

    externalBucketObjects = (await externalGateway.list()) as S3.ObjectList
    expect(externalBucketObjects).toHaveLength(0)

    const internalBucketObjects = (await internalGateway.list()) as S3.ObjectList
    expect(internalBucketObjects).toHaveLength(0)

    conductorBucketObjects = (await conductorGateway.list()) as S3.ObjectList
    expect(conductorBucketObjects).toHaveLength(1)
    expect(conductorBucketObjects[0].Key).toBe(fileName)
  })
})
