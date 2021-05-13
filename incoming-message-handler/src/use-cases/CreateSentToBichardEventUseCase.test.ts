import axios, { AxiosError } from "axios"
import { AuditLog, isError } from "shared"
import CreateSentToBichardEventUseCase from "./CreateSentToBichardEventUseCase"

const message = new AuditLog("b5edf595-16a9-450f-a52b-40628cd58c29", new Date(), "<XML></XML>")
const useCase = new CreateSentToBichardEventUseCase("http://localhost")

describe("createSentToBichardEvent()", () => {
  it("should return Created http status code when message exists", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await useCase.create(message)

    expect(isError(result)).toBe(false)
  })

  it("should fail when message does not exist", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 404 })

    const result = await useCase.create(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe(`The message with Id ${message.messageId} does not exist.`)
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "post").mockRejectedValue(expectedError)

    const result = await useCase.create(message)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })
})
