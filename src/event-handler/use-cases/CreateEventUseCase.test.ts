import { FakeApiClient } from "src/shared/testing"
import type { ApiAuditLogEvent } from "src/shared/types"
import CreateEventUseCase from "./CreateEventUseCase"

const fakeApiClient = new FakeApiClient()
const useCase = new CreateEventUseCase(fakeApiClient)

describe("CreateEventUseCase", () => {
  const mockedCreateEvent = jest.spyOn(fakeApiClient, "createEvent")
  const mockedCreateUserEvent = jest.spyOn(fakeApiClient, "createUserEvent")

  beforeEach(() => {
    fakeApiClient.reset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be successful when messageId has value", async () => {
    const result = await useCase.execute("DummyMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
    expect(mockedCreateEvent).toHaveBeenCalledTimes(1)
    expect(mockedCreateUserEvent).not.toHaveBeenCalled()
  })

  it("should be successful when only 'user' has value", async () => {
    const result = await useCase.execute("", { attributes: { "User ID": "Dummy user" } } as unknown as ApiAuditLogEvent)

    expect(result).toBeUndefined()
    expect(mockedCreateEvent).not.toHaveBeenCalled()
    expect(mockedCreateUserEvent).toHaveBeenCalledTimes(1)
  })

  it("should be successful when messageId and user are not provided", async () => {
    const result = await useCase.execute("", {} as ApiAuditLogEvent)

    expect(result).toBeUndefined()
    expect(mockedCreateEvent).not.toHaveBeenCalled()
    expect(mockedCreateUserEvent).not.toHaveBeenCalled()
  })

  it("should fail when audit log API fails to create event when messageId has value", async () => {
    const expectedError = new Error("Create event failed")
    fakeApiClient.setErrorReturnedByFunctions(expectedError, ["createEvent"])
    const result = await useCase.execute("DummyMessageId", {} as ApiAuditLogEvent)

    expect(result).toBeError(expectedError.message)
  })

  it("should fail when audit log API fails to create event when only user has value", async () => {
    const expectedError = new Error("Create user event failed")
    fakeApiClient.setErrorReturnedByFunctions(expectedError, ["createUserEvent"])
    const result = await useCase.execute("", { attributes: { "User ID": "Dummy user" } } as unknown as ApiAuditLogEvent)

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
