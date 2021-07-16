import type { AxiosError } from "axios"
import axios from "axios"
import { isError, AuditLog } from "shared"
import PersistMessageUseCase from "./PersistMessageUseCase"

const message = new AuditLog("id", new Date(), "XML")
message.caseId = "123"

const useCase = new PersistMessageUseCase("http://localhost")

describe("persistMessage", () => {
  it("should return true when server responds with 201 status code", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(false)
    expect(result).toBeNull()
  })

  it("should fail when server does not responds with 201 status code", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 400 })

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toContain("400")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "post").mockRejectedValue(expectedError)

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })
})
