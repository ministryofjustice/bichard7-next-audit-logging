import "@bichard/testing-jest"
import { isError } from "shared"
import { AuditLogApiClient } from "@bichard/api-client"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"

const apiClient = new AuditLogApiClient("Dummy API URL")
const useCase = new CreateRetryingEventUseCase(apiClient)

it("should create event when message id exists in the database", async () => {
  jest.spyOn(apiClient, "createEvent").mockResolvedValue()

  const result = await useCase.create("Message ID")

  expect(result).toNotBeError()
})

it("should return error when API returns error", async () => {
  const expectedError = new Error("Expected Error Message")
  jest.spyOn(apiClient, "createEvent").mockResolvedValue(expectedError)

  const result = await useCase.create("Message ID")

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe(expectedError.message)
})
