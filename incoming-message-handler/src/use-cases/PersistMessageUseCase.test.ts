import { isError } from "@handlers/common"
import { AuditLog } from "../entities"
import AuditLogDynamoGateway from "../gateways/AuditLogDynamoGateway"
import { DynamoDbConfig } from "../configs"
import PersistMessageUseCase from "./PersistMessageUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1"
}

const gateway = new AuditLogDynamoGateway(config, "AuditLog")
const useCase = new PersistMessageUseCase(gateway)

const message = new AuditLog("id", new Date(), "XML")

describe("PersistMessageUseCase", () => {
  it("should create the message when valid", async () => {
    jest.spyOn(gateway, "create").mockResolvedValue(message)

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(message.messageId)
    expect(actualMessage.receivedDate).toBe(message.receivedDate)
    expect(actualMessage.messageXml).toBe("XML")
  })

  it("should fail when the message already exists", async () => {
    jest.spyOn(gateway, "create").mockResolvedValue(new Error("The conditional request failed"))

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(true)
    expect((<Error>result).message).toBe("A message with Id id already exists in the database")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = new Error("An unknown error")
    jest.spyOn(gateway, "create").mockResolvedValue(expectedError)

    const result = await useCase.persist(message)

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })
})
