import { isError } from "@handlers/common"
import S3Gateway from "../gateways/S3Gateway"
import { S3Config } from "../configs"
import UploadMessageUseCase from "./UploadMessageUseCase"

const config: S3Config = {
  S3_URL: "localhost",
  S3_REGION: "us-east-1"
}

const messageId = "123456"
const receivedDate = new Date(2021, 3, 9, 12, 15, 18)
const gateway = new S3Gateway(config)
const useCase = new UploadMessageUseCase(gateway)
const expectedResult = "2021/04/09/12/15/123456.xml"

describe("UploadMessageUseCase", () => {
  it("should save the message", async () => {
    jest.spyOn(gateway, "upload").mockResolvedValue(undefined)

    const result = await useCase.save({ messageId, caseId: "case123", receivedDate, rawXml: "message" })

    expect(isError(result)).toBe(false)
    expect(result).toBe(expectedResult)
  })

  it("should fail when the error is unknown", async () => {
    jest.spyOn(gateway, "upload").mockResolvedValue(new Error("An unknown error"))

    const result = await useCase.save({ messageId, caseId: "case123", receivedDate, rawXml: "message" })

    expect(isError(result)).toBe(true)

    const error = <Error>result

    expect(error.message).toBe(`The file ${expectedResult} could not be saved`)
  })
})
