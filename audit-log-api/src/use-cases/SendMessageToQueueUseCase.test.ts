import "@bichard/testing-jest"
import { FakeMqGateway } from "@bichard/testing-mq"
import { isError } from "shared"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"

const gateway = new FakeMqGateway()
const useCase = new SendMessageToQueueUseCase(gateway)

it("should be sucessfull when MQ gateway successfully pushes the message to the queue", async () => {
  gateway.reset()
  const result = await useCase.send("Dummy Queue Name", "Dummy Message")

  expect(result).toNotBeError()
  expect(result).toBeUndefined()
})

it("should return error when MQ gateway throws exception", async () => {
  const expectedError = new Error("Expected Error Message")
  gateway.shouldReturnError(expectedError)
  const result = await useCase.send("Dummy Queue Name", "Dummy Message")

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe(expectedError.message)
})
