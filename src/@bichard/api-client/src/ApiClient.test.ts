import "@bichard/testing"
import type { AxiosError } from "axios"
import axios from "axios"
import { AuditLog, AuditLogEvent, isError } from "shared"
import ApiClient from "./ApiClient"

const apiClient = new ApiClient("http://localhost")
const message = new AuditLog("b5edf595-16a9-450f-a52b-40628cd58c29", new Date(), "<XML></XML>")
const event = new AuditLogEvent({
  category: "information",
  timestamp: new Date(),
  eventType: "Dummy Event Type",
  eventSource: "Dummy Event Source"
})

describe("createEvent()", () => {
  it("should return Created http status code when message exists", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await apiClient.createEvent(message.messageId, event)

    expect(result).toNotBeError()
  })

  it("should fail when message does not exist", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 404 })

    const result = await apiClient.createEvent(message.messageId, event)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe(`The message with Id ${message.messageId} does not exist.`)
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "post").mockRejectedValue(expectedError)

    const result = await apiClient.createEvent(message.messageId, event)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })
})
