import { FakeApiClient } from "src/shared/testing"
import type { ApiAuditLogEvent } from "src/shared/types"
import CreateEventUseCase from "./CreateEventUseCase"

const fakeApiClient = new FakeApiClient()
const useCase = new CreateEventUseCase(fakeApiClient)

describe("CreateEventUseCase", () => {
  beforeEach(() => {
    fakeApiClient.reset()
  })

  it("should be successful when event is created successfully", async () => {
    const result = await useCase.execute("DummyMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should be successful when event does not have messageId", async () => {
    const result = await useCase.execute("", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should fail when audit log API fails to create event", async () => {
    const expectedError = new Error("Create event failed")
    fakeApiClient.setErrorReturnedByFunctions(expectedError, ["createEvent"])
    const result = await useCase.execute("DummyMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeError(expectedError.message)
  })

  it("should be successful when create audit log returns message id exists error", async () => {
    const expectedError = new Error("A message with Id DUMMY already exists")
    fakeApiClient.setErrorReturnedByFunctions(expectedError, ["createAuditLog"])
    const result = await useCase.execute("ExistingMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
  })

  it("should be successful when create audit log returns message hash exists error", async () => {
    const expectedError = new Error("Error creating audit log: Message hash already exists")
    fakeApiClient.setErrorReturnedByFunctions(expectedError, ["createAuditLog"])
    const result = await useCase.execute("DummyMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
  })
})
