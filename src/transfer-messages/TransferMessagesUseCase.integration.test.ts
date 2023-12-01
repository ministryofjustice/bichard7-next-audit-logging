import type { S3 } from "aws-sdk"
import { S3Gateway, TestS3Gateway } from "src/shared"
import "src/shared/testing"

import { conductorIncomingS3Config, externalIncomingS3Config, internalIncomingS3Config } from "src/shared/testing"
import TransferMessagesUseCase from "./TransferMessagesUseCase"
import type { TransferMessagesResult } from "./types"

const externalGateway = new S3Gateway(externalIncomingS3Config)
const externalS3 = new TestS3Gateway(externalIncomingS3Config)
const internalS3 = new TestS3Gateway(internalIncomingS3Config)
const conductorS3 = new TestS3Gateway(conductorIncomingS3Config)
const transferMessages = new TransferMessagesUseCase(
  externalGateway,
  internalS3.getBucketName(),
  conductorS3.getBucketName(),
  0.0
)

describe("TransferMessagesUseCase", () => {
  beforeEach(async () => {
    await externalS3.deleteAll()
    await internalS3.deleteAll()
    await conductorS3.deleteAll()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should move only one and the oldest file from one bucket to another", async () => {
    const fileNameA = "2021/04/09/12/06/123456.xml"
    const fileNameB = "2021/05/09/12/06/123456.xml"
    await externalS3.upload(fileNameA, "Dummy content A")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await externalS3.upload(fileNameB, "Dummy content B")

    let bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(2)
    expect(bucketAObjects[0].Key).toBe(fileNameA)
    expect(bucketAObjects[1].Key).toBe(fileNameB)
    let bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(0)

    const result = await transferMessages.execute({ numberOfObjectsToTransfer: 1 })

    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = result as TransferMessagesResult
    expect(successful).toHaveLength(1)
    expect(failedToCopy).toHaveLength(0)
    expect(failedToDelete).toHaveLength(0)
    expect(successful[0]).toBe(fileNameA)

    bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(1)
    expect(bucketAObjects[0].Key).toBe(fileNameB)

    bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(1)
    expect(bucketBObjects[0].Key).toBe(fileNameA)
  })

  it("should move all files from one bucket to another", async () => {
    const fileNames = [
      "2021/04/09/12/06/123456.xml",
      "2021/05/09/12/06/123456.xml",
      "2021/06/09/12/06/123456.xml",
      "2021/07/09/12/06/123456.xml"
    ].sort()

    await Promise.allSettled(fileNames.map((fileName, index) => externalS3.upload(fileName, `Dummy content ${index}`)))

    let bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(fileNames.length)
    let bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(0)

    const result = await transferMessages.execute({})

    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = result as TransferMessagesResult
    expect(successful).toHaveLength(fileNames.length)
    expect(failedToCopy).toHaveLength(0)
    expect(failedToDelete).toHaveLength(0)
    expect(successful.sort()).toEqual(fileNames)

    bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(0)

    bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(fileNames.length)
    const bucketBObjectKeys = bucketBObjects.map((item) => item.Key!).sort()
    expect(bucketBObjectKeys).toEqual(fileNames)
  })

  it("should return error when there is an issue with listing objects", async () => {
    const fileName = "2021/04/09/12/06/123456.xml"
    await externalS3.upload(fileName, "Dummy content A")

    const expectedError = new Error("Failed to list objects")
    jest.spyOn(externalGateway, "list").mockResolvedValue(expectedError)
    const result = await transferMessages.execute({})

    expect(result).toBeError(expectedError.message)

    const bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(1)
    expect(bucketAObjects[0].Key).toBe(fileName)

    const bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(0)
  })

  it("should return failure when there is an issue with copying file", async () => {
    const fileName = "2021/04/09/12/06/123456.xml"
    await externalS3.upload(fileName, "Dummy content A")

    const expectedError = new Error("Failed to copy")
    jest.spyOn(externalGateway, "copyItemTo").mockResolvedValue(expectedError)
    const result = await transferMessages.execute({})

    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = result as TransferMessagesResult
    expect(successful).toHaveLength(0)
    expect(failedToCopy).toHaveLength(1)
    expect(failedToDelete).toHaveLength(0)
    expect(failedToCopy[0].key).toBe(fileName)
    expect(failedToCopy[0].error).toBe(expectedError.message)

    const bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(1)
    expect(bucketAObjects[0].Key).toBe(fileName)

    const bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(0)
  })

  it("should return failure when there is an issue with deleting file", async () => {
    const fileName = "2021/04/09/12/06/123456.xml"
    await externalS3.upload(fileName, "Dummy content A")

    const expectedError = new Error("Failed to delete")
    jest.spyOn(externalGateway, "deleteItem").mockResolvedValue(expectedError)
    const result = await transferMessages.execute({})

    expect(result).toNotBeError()

    const { successful, failedToCopy, failedToDelete } = result as TransferMessagesResult
    expect(successful).toHaveLength(0)
    expect(failedToCopy).toHaveLength(0)
    expect(failedToDelete).toHaveLength(1)
    expect(failedToDelete[0].key).toBe(fileName)
    expect(failedToDelete[0].error).toBe(expectedError.message)

    const bucketAObjects = (await externalS3.list()) as S3.ObjectList
    expect(bucketAObjects).toHaveLength(1)
    expect(bucketAObjects[0].Key).toBe(fileName)

    const bucketBObjects = (await internalS3.list()) as S3.ObjectList
    expect(bucketBObjects).toHaveLength(1)
    expect(bucketBObjects[0].Key).toBe(fileName)
  })
})
