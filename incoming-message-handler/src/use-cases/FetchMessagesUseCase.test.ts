import { isError } from "@handlers/common"
import { AuditLog } from "src/entities"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import { DynamoDbConfig } from "src/configs"
import FetchMessagesUseCase from "./FetchMessagesUserCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1"
}

const gateway = new AuditLogDynamoGateway(config, "AuditLog")
const useCase = new FetchMessagesUseCase(gateway)

const message = new AuditLog("id", new Date(), "XML")

describe("FetchMessagesUseCase", () => {
  it("should get the messages", async () => {
    jest.spyOn(gateway, "fetchMany").mockResolvedValue([message])

    const result = await useCase.get()

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog[]>result
    expect(actualMessage.length).toBe(1)
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

    const result = await useCase.get()

    expect(isError(result)).toBe(true)
    expect(result).toEqual(expectedError)
  })
})
