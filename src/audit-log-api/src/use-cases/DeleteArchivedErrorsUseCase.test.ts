import { BichardPostgresGateway } from "shared"
import "shared-testing"
import { setEnvironmentVariables } from "shared-testing"
import { isError } from "shared-types"
import createBichardPostgresGatewayConfig from "../createBichardPostgresGatewayConfig"
import DeleteArchivedErrorsUseCase from "./DeleteArchivedErrorsUseCase"
setEnvironmentVariables()

const postgresConfig = createBichardPostgresGatewayConfig()
const postgresGateway = new BichardPostgresGateway(postgresConfig)
const useCase = new DeleteArchivedErrorsUseCase(postgresGateway)

it("should call the #deleteArchivedErrors on postgres gateway with the given messageId", async () => {
  const messageId = "msgId"
  const deleteArchivedErrorsSpy = jest.spyOn(postgresGateway, "deleteArchivedErrors").mockResolvedValue(undefined)

  const result = await useCase.call(messageId)

  expect(result).toNotBeError()
  expect(deleteArchivedErrorsSpy).toHaveBeenCalledTimes(1)
  expect(deleteArchivedErrorsSpy).toHaveBeenCalledWith(messageId)
})

it("should return error when the gateway returns error", async () => {
  const messageId = "msgId"
  const expectedError = new Error("Dummy Error Message")
  jest.spyOn(postgresGateway, "deleteArchivedErrors").mockResolvedValue(expectedError)

  const result = await useCase.call(messageId)

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
