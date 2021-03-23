import { isError } from "@handlers/common"
import { Message } from "src/entities"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import { DynamoDbConfig } from "src/configs"
import FetchMessagesUseCase from "./FetchMessagesUserCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1"
}

const gateway = new AuditLogDynamoGateway(config, "AuditLog")
const useCase = new FetchMessagesUseCase(gateway)

const message: Message = { messageId: "id", caseId: "123", receivedDate: new Date(2021, 12, 10) }

describe("FetchMessagesUseCase", () => {
  it("should get the messages", async () => {
    jest.spyOn(gateway, "fetchMany").mockResolvedValue([message])

    const result = await useCase.get()
    const actualMessages = <Message[]>result
    const actualMessage = actualMessages[0]

    expect(isError(result)).toBe(false)
    expect(actualMessages.length).toBe(1)
    expect(actualMessage.messageId).toEqual(message.messageId)
    expect(actualMessage.caseId).toEqual(message.caseId)
    expect(actualMessage.receivedDate.toDateString()).toEqual("Mon Jan 10 2022")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

    const result = await useCase.get()

    expect(isError(result)).toBe(true)
    expect(result).toEqual(expectedError)
  })
})
