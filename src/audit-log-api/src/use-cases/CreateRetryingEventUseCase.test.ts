import { FakeApiClient } from "shared-testing"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"

const fakeApiClient = new FakeApiClient()
const useCase = new CreateRetryingEventUseCase(fakeApiClient)

it("should create event when message id exists in the database", async () => {
  fakeApiClient.reset()
  const result = await useCase.create("Message ID")

  expect(result).toNotBeError()
})

it("should return error when API returns error", async () => {
  const expectedError = new Error("Expected Error Message")
  fakeApiClient.setErrorForFunctions(expectedError)

  const result = await useCase.create("Message ID")

  expect(result).toBeError(expectedError.message)
})
