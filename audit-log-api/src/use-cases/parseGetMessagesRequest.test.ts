import { AuditLog, AuditLogDynamoGateway, isError } from "shared"
import { APIGatewayProxyEvent } from "aws-lambda"
import parseGetMessagesRequest from "./parseGetMessagesRequest"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

describe("parseGetMessageRequest()", () => {
  it("should return all messages when there are no path or query string parameters", async () => {
    const expectedMessages = [
      new AuditLog("1", new Date(), "Xml"),
      new AuditLog("2", new Date(), "Xml"),
      new AuditLog("3", new Date(), "Xml")
    ]
    const event = <APIGatewayProxyEvent>{}
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "get").mockResolvedValue(expectedMessages)

    const parseRequestResult = parseGetMessagesRequest(event, fetchMessages)
    const actualMessages = await parseRequestResult.fetchMessages()

    expect(actualMessages).toBeDefined()
    expect(actualMessages).toHaveLength(3)
  })

  it("should return one message when messageId exists in the path", async () => {
    const expectedMessage = new AuditLog("1", new Date(), "Xml")
    const event = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: expectedMessage.messageId
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "getById").mockResolvedValue(expectedMessage)

    const parseRequestResult = parseGetMessagesRequest(event, fetchMessages)
    const result = await parseRequestResult.fetchMessages()

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
  })

  it("should return one message when externalCorrelationId exists in the query string", async () => {
    const expectedMessage = new AuditLog("1", new Date(), "Xml")
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        externalCorrelationId: "1"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "getByExternalCorrelationId").mockResolvedValue(expectedMessage)

    const parseRequestResult = parseGetMessagesRequest(event, fetchMessages)
    const result = await parseRequestResult.fetchMessages()

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.externalCorrelationId).toBe("1")
  })

  it("should return one message by messageId when messageId and externalCorrelationId exist in the path and query string", async () => {
    const expectedMessage = new AuditLog("1", new Date(), "Xml")
    const event = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: expectedMessage.messageId
      },
      queryStringParameters: {
        externalCorrelationId: "2"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "getById").mockResolvedValue(expectedMessage)

    const parseRequestResult = parseGetMessagesRequest(event, fetchMessages)
    const result = await parseRequestResult.fetchMessages()

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
  })
})
