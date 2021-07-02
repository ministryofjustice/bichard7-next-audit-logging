import { AuditLog, AuditLogDynamoGateway, AuditLogStatus, isError } from "shared"
import { APIGatewayProxyEvent } from "aws-lambda"
import createMessageFetcher from "./createMessageFetcher"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

describe("createMessageFetcher()", () => {
  it("should return all messages when there are no path or query string parameters", async () => {
    const expectedMessages = [
      new AuditLog("1", new Date(), "Xml"),
      new AuditLog("2", new Date(), "Xml"),
      new AuditLog("3", new Date(), "Xml")
    ]
    const event = <APIGatewayProxyEvent>{}
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "get").mockResolvedValue(expectedMessages)

    const messageFetcher = createMessageFetcher(event, fetchMessages)
    const result = await messageFetcher.fetch()

    expect(isError(result)).toBe(false)

    const actualMessages = <AuditLog[]>result
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

    const messageFetcher = createMessageFetcher(event, fetchMessages)
    const result = await messageFetcher.fetch()

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

    const messageFetcher = createMessageFetcher(event, fetchMessages)
    const result = await messageFetcher.fetch()

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

    const messageFetcher = createMessageFetcher(event, fetchMessages)
    const result = await messageFetcher.fetch()

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
  })

  it("should return messages by status when status parameter exists in the query string", async () => {
    const expectedStatus = AuditLogStatus.error
    const expectedMessage = new AuditLog("1", new Date(), "Xml")
    expectedMessage.status = expectedStatus
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        status: expectedStatus
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
    jest.spyOn(fetchMessages, "getByStatus").mockResolvedValue([expectedMessage])

    const messageFetcher = createMessageFetcher(event, fetchMessages)
    const result = await messageFetcher.fetch()

    expect(isError(result)).toBe(false)

    const actualMessages = <AuditLog[]>result
    expect(actualMessages).toHaveLength(1)

    const actualMessage = actualMessages[0]
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.status).toBe(expectedStatus)
  })
})
