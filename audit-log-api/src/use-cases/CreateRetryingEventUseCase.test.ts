import "@bichard/testing-jest"
import { isError } from "shared"
import { FakeApiClient } from "@bichard/testing-api-client"
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
  fakeApiClient.shouldReturnError(expectedError)

  const result = await useCase.create("Message ID")

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe(expectedError.message)
})
