jest.mock("src/use-cases/FetchMessagesUserCase")

import FetchMessagesUseCase from "src/use-cases/FetchMessagesUserCase"
import { Message } from "src/entities"
import { APIGatewayProxyResult } from "aws-lambda"
import getMessages from "./getMessages"

const expectedSuccessfulResponse: Message[] = [
  {
    messageId: "1",
    caseId: "123",
    receivedDate: new Date(2021, 10, 12)
  },
  {
    messageId: "2",
    caseId: "456",
    receivedDate: new Date(2021, 10, 13)
  }
]

const expectedSuccessfulBodyResponse =
  '{"messages":[{"messageId":"1","caseId":"123","receivedDate":"2021-11-12T00:00:00.000Z"},{"messageId":"2","caseId":"456","receivedDate":"2021-11-13T00:00:00.000Z"}]}'
const expecctedErrorBodyResponse = "Error: Call failed"

describe("getMessages()", () => {
  it("should respond with a list of messages", async () => {
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(expectedSuccessfulResponse)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(200)
    expect(actualResponse.body).toEqual(expectedSuccessfulBodyResponse)
  })

  it("should respond with error", async () => {
    const error = new Error("Call failed")
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(error)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(500)
    expect(actualResponse.body).toEqual(expecctedErrorBodyResponse)
  })
})
