import { isError } from "@handlers/common"
import S3Gateway from "../gateways/S3Gateway"
import { S3Config } from "../types"
import { getFileName } from "../utils/file"
import UploadMessageUseCase from "./UploadMessageUseCase"

const config: S3Config = {
  S3_URL: "localhost",
  S3_REGION: "us-east-1"
}

const gateway = new S3Gateway(config)
const useCase = new UploadMessageUseCase(gateway)

describe("UploadMessageUseCase", () => {
  it("should save the message", async () => {
    jest.spyOn(gateway, "upload").mockResolvedValue(undefined)

    const messageId = "message123"
    const receivedDate = new Date()
    const expectedResult = getFileName(receivedDate, messageId)
    const result = await useCase.save({ messageId, caseId: "case123", receivedDate, rawXml: "message" })

    expect(isError(result)).toBe(false)
    expect(result).toBe(expectedResult)
  })

  it("should fail when the error is unknown", async () => {
    const messageId = "message123"
    const receivedDate = new Date()
    const expectedFileName = getFileName(receivedDate, messageId)
    jest.spyOn(gateway, "upload").mockResolvedValue(new Error("An unknown error"))

    const result = await useCase.save({ messageId, caseId: "case123", receivedDate, rawXml: "message" })

    expect(isError(result)).toBe(true)

    const error = <Error>result
    expect(error.message).toBe(`The file ${expectedFileName} could not be saved`)
  })
})
