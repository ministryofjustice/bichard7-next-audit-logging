import "@bichard/testing-jest"
import { FakeApiClient } from "@bichard/testing-api-client"
import type { AuditLogEvent } from "shared"
import CreateEventUseCase from "./CreateEventUseCase"

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
