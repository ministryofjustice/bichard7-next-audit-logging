import "shared-testing"
import type { AxiosError } from "axios"
import axios from "axios"
import { AuditLog, AuditLogEvent, isError } from "shared-types"
import AuditLogApiClient from "./AuditLogApiClient"

const apiClient = new AuditLogApiClient("http://localhost", "dummy")
const message = new AuditLog("b5edf595-16a9-450f-a52b-40628cd58c29", new Date())
message.messageHash = "hash-1"
const message2 = new AuditLog("b5edf595-16a9-450f-a52b-40628cd58c28", new Date())
message2.messageHash = "hash-2"
const event = new AuditLogEvent({
  category: "information",
  timestamp: new Date(),
  eventType: "Dummy Event Type",
  eventSource: "Dummy Event Source"
})

describe("getMessages()", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return the messages if successful", async () => {
    jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message, message2] })

    const result = await apiClient.getMessages()

    expect(result).toNotBeError()
    expect(result).toEqual([message, message2])
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "get").mockRejectedValue(expectedError)

    const result = await apiClient.getMessages()

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })

  it("should filter by status", async () => {
    const getRequest = jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message, message2] })

    const result = await apiClient.getMessages({ status: "Error" })

    expect(result).toNotBeError()
    expect(result).toEqual([message, message2])
    expect(getRequest.mock.calls[0][0]).toBe(`http://localhost/messages?status=Error`)
  })

  it("should filter by lastMessageId", async () => {
    const getRequest = jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message, message2] })

    const result = await apiClient.getMessages({ lastMessageId: "12345" })

    expect(result).toNotBeError()
    expect(result).toEqual([message, message2])
    expect(getRequest.mock.calls[0][0]).toBe(`http://localhost/messages?lastMessageId=12345`)
  })

  it("should filter by status and lastMessageId", async () => {
    const getRequest = jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message, message2] })

    const result = await apiClient.getMessages({ status: "Error", lastMessageId: "12345" })

    expect(result).toNotBeError()
    expect(result).toEqual([message, message2])
    expect(getRequest.mock.calls[0][0]).toBe(`http://localhost/messages?lastMessageId=12345&status=Error`)
  })
})

describe("getMessage()", () => {
  it("should return the message when message exists", async () => {
    jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message] })

    const result = await apiClient.getMessage(message.messageId)

    expect(result).toNotBeError()

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(message.messageId)
    expect(actualMessage.externalCorrelationId).toBe(message.externalCorrelationId)
    expect(actualMessage.receivedDate).toBe(message.receivedDate)
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "get").mockRejectedValue(expectedError)

    const result = await apiClient.getMessage(message.messageId)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })

  it("should pass through the api key as a header", async () => {
    const mockGet = jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [] })

    const result = await apiClient.getMessage(message.messageId)

    expect(result).toNotBeError()
    expect(mockGet.mock?.calls?.[0]?.[1]?.headers?.["X-API-Key"]).toBe("dummy")
  })
})

describe("getMessageByHash()", () => {
  it("should return the message when message hash exists", async () => {
    jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [message] })

    const result = await apiClient.getMessageByHash(message.messageHash)

    expect(result).toNotBeError()

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(message.messageId)
    expect(actualMessage.messageHash).toBe(message.messageHash)
    expect(actualMessage.externalCorrelationId).toBe(message.externalCorrelationId)
    expect(actualMessage.receivedDate).toBe(message.receivedDate)
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "get").mockRejectedValue(expectedError)

    const result = await apiClient.getMessageByHash(message.messageHash)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })

  it("should pass through the api key as a header", async () => {
    const mockGet = jest.spyOn(axios, "get").mockResolvedValue({ status: 200, data: [] })

    const result = await apiClient.getMessageByHash(message.messageHash)

    expect(result).toNotBeError()
    expect(mockGet.mock?.calls?.[0]?.[1]?.headers?.["X-API-Key"]).toBe("dummy")
  })
})

describe("createAuditLog()", () => {
  it("should return Created http status code when message successfully created", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await apiClient.createAuditLog(message)

    expect(result).toNotBeError()
  })

  it("should fail when message validation fails", async () => {
    jest.spyOn(axios, "post").mockResolvedValue({ status: 400, data: "Message ID is mandatory" })

    const result = await apiClient.createAuditLog(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe("Error 400: Message ID is mandatory")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = <AxiosError>new Error("An unknown error")
    jest.spyOn(axios, "post").mockRejectedValue(expectedError)

    const result = await apiClient.createAuditLog(message)

    expect(isError(result)).toBe(true)
    expect(<Error>result).toBe(expectedError)
  })

  it("should pass through the api key as a header", async () => {
    const mockPost = jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await apiClient.createAuditLog(message)

    expect(result).toNotBeError()
    expect(mockPost.mock?.calls?.[0]?.[2]?.headers?.["X-API-Key"]).toBe("dummy")
  })
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

  it("should pass through the api key as a header", async () => {
    const mockPost = jest.spyOn(axios, "post").mockResolvedValue({ status: 201 })

    const result = await apiClient.createEvent(message.messageId, event)

    expect(result).toNotBeError()
    expect(mockPost.mock?.calls?.[0]?.[2]?.headers?.["X-API-Key"]).toBe("dummy")
  })

  it("should fail when the api request times out", async () => {
    const timedOutResponse = <AxiosError>{ code: "ECONNABORTED" }
    const expectedErrorMsg = `Timed out creating event for message with Id ${message.messageId}.`
    jest.spyOn(axios, "post").mockRejectedValue(timedOutResponse)

    const result = await apiClient.createEvent(message.messageId, event)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe(expectedErrorMsg)
  })

  describe("retryEvent()", () => {
    it("should succeed when the message exists", async () => {
      jest.spyOn(axios, "post").mockResolvedValue({ status: 204 })

      const result = await apiClient.retryEvent(message.messageId)

      expect(result).toNotBeError()
    })

    it("should fail when message does not exist", async () => {
      jest.spyOn(axios, "post").mockResolvedValue({ status: 404 })

      const result = await apiClient.retryEvent(message.messageId)

      expect(isError(result)).toBe(true)
      expect((<Error>result).message).toBe(`The message with Id ${message.messageId} does not exist.`)
    })

    it("should fail when the error is unknown", async () => {
      const expectedError = <AxiosError>new Error("An unknown error")
      jest.spyOn(axios, "post").mockRejectedValue(expectedError)

      const result = await apiClient.retryEvent(message.messageId)

      expect(isError(result)).toBe(true)
      expect(<Error>result).toBe(expectedError)
    })

    it("should pass through the api key as a header", async () => {
      const mockPost = jest.spyOn(axios, "post").mockResolvedValue({ status: 204 })

      const result = await apiClient.retryEvent(message.messageId)

      expect(result).toNotBeError()
      expect(mockPost.mock?.calls?.[0]?.[2]?.headers?.["X-API-Key"]).toBe("dummy")
    })
  })
})
