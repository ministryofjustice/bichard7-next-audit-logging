import "@bichard/testing-jest"
import { FakeApiClient } from "@bichard/testing-api-client"
import type { AuditLogEvent } from "shared"
import type { ApiClient } from "@bichard/api-client"
import CreateEventUseCase from "./CreateEventUseCase"

describe("execute", () => {
  const fakeApiClient = new FakeApiClient()

  it("should be successful when event is created successfully", async () => {
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    const result = await useCase.execute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should fail when audit log API fails to get message", async () => {
    const expectedError = new Error("Get message failed")
    const useCase = new CreateEventUseCase(fakeApiClient)

    fakeApiClient.reset()
    fakeApiClient.shouldReturnError(expectedError, ["getMessage"])
    const result = await useCase.execute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeError(expectedError.message)
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
})

describe("retryExecute", () => {
  const useCase = new CreateEventUseCase({} as ApiClient)

  it("should not retry more than 3 times", async () => {
    const expectedError = Error("Request failed with status code 409")
    let retries = 0
    jest.spyOn(useCase, "execute").mockImplementation(() => {
      retries += 1
      return Promise.resolve(expectedError)
    })
    const result = await useCase.retryExecute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeError(expectedError.message)
    expect(retries).toEqual(3)
  })

  it("should not retry when non-cnflict error is returned", async () => {
    const expectedError = Error("Other errors")
    let retries = 0
    jest.spyOn(useCase, "execute").mockImplementation(() => {
      retries += 1
      return Promise.resolve(expectedError)
    })
    const result = await useCase.retryExecute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toBeError(expectedError.message)
    expect(retries).toEqual(1)
  })

  it("should not retry when there is no error", async () => {
    let retries = 0
    jest.spyOn(useCase, "execute").mockImplementation(() => {
      retries += 1
      return Promise.resolve()
    })
    const result = await useCase.retryExecute("DummyMessageId", {} as AuditLogEvent)

    expect(result).toNotBeError()
    expect(retries).toEqual(1)
  })
})
