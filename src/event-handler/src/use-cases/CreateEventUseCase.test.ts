import { FakeApiClient } from "shared-testing"
import type { AuditLogEvent } from "shared-types"
import CreateEventUseCase from "./CreateEventUseCase"

describe("CreateEventUseCase tests", () => {
  const fakeApiClient = new FakeApiClient()

  it("should be successful when event is created successfully", async () => {
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    const result = await useCase.execute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should be successful when event does not have messageId", async () => {
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    const result = await useCase.execute("", {} as AuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should fail when audit log API fails to create message", async () => {
    const expectedError = new Error("Create audit log failed")
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    fakeApiClient.shouldReturnError(expectedError, ["createAuditLog"])
    const result = await useCase.execute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeError(expectedError.message)
  })

  it("should fail when audit log API fails to create event", async () => {
    const expectedError = new Error("Create event failed")
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    fakeApiClient.shouldReturnError(expectedError, ["createEvent"])
    const result = await useCase.execute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeError(expectedError.message)
  })

  it("should retry to create events when the request times out", async () => {
    const messageId = "dummy-message-id"
    const expectedErorr = new Error(`Timed out creating event for message with Id ${messageId}`)
    jest.clearAllMocks()
    const mockedEndpoint = jest.spyOn(FakeApiClient.prototype, "createEvent").mockResolvedValue(expectedErorr)
    const useCase = new CreateEventUseCase(fakeApiClient)

    const result = await useCase.execute(messageId, {} as AuditLogEvent)

    expect(mockedEndpoint).toHaveBeenCalledTimes(5)
    expect(result).toBeError(expectedErorr.message)
  })

  it("should succeed after 2 retries and one successful request", async () => {
    const messageId = "dummy-message-id"
    const expectedErorr = new Error(`Timed out creating event for message with Id ${messageId}`)
    let attempts = 0
    jest.clearAllMocks()
    jest.spyOn(FakeApiClient.prototype, "createEvent").mockImplementation(() => {
      attempts++
      if (attempts > 2) {
        return Promise.resolve()
      }

      return Promise.resolve(expectedErorr)
    })
    const useCase = new CreateEventUseCase(fakeApiClient)

    const result = await useCase.execute(messageId, {} as AuditLogEvent)

    expect(attempts).toBe(3)
    expect(result).toNotBeError()
  })

  it("shouldn't retry non-timeout errors", async () => {
    const expectedErorr = new Error(`dummy error message not related to timeouts`)
    jest.clearAllMocks()
    const mockedEndpoint = jest.spyOn(FakeApiClient.prototype, "createEvent").mockResolvedValue(expectedErorr)
    const useCase = new CreateEventUseCase(fakeApiClient)

    const result = await useCase.execute("dummy-message-id", {} as AuditLogEvent)

    expect(mockedEndpoint).toHaveBeenCalledTimes(1)
    expect(result).toBeError(expectedErorr.message)
  })
})
