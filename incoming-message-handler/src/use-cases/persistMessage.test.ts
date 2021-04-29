import axios, { AxiosError } from "axios"
import { isError, AuditLog } from "shared"
import persistMessage from "./persistMessage"

const message = new AuditLog("id", new Date(), "XML")
message.caseId = "123"

describe("persistMessage", () => {
  it("should return true when server responds with 201 status code", async () => {
    const expectedSuccessfulServerResponse = { data: "Created", status: 201 }
    jest.spyOn(axios, "post").mockResolvedValue(expectedSuccessfulServerResponse)

    const result = await persistMessage(message)

    expect(isError(result)).toBe(false)
    expect(result).toBeNull()
  })

  it("should fail when server does not responds with 201 status code", async () => {
    const expectedFailedServerResponse = { status: 400 }
    jest.spyOn(axios, "post").mockResolvedValue(Promise.resolve(expectedFailedServerResponse))

    const result = await persistMessage(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toContain("400")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "post").mockRejectedValue(expectedError)

    const result = await persistMessage(message)

    expect(<Error>result).toBe(expectedError)
  })
})
