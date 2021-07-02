import { AuditLogDynamoGateway } from "shared"
import { APIGatewayProxyEvent } from "aws-lambda"
import { FetchAll, FetchByExternalCorrelationId, FetchById, FetchByStatus } from "src/utils/MessageFetchers"
import createMessageFetcher from "./createMessageFetcher"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

describe("createMessageFetcher()", () => {
  it("should return FetchAll when there are no path or query string parameters", () => {
    const event = <APIGatewayProxyEvent>{}
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})

    const messageFetcher = createMessageFetcher(event, fetchMessages)

    expect(messageFetcher instanceof FetchAll).toBe(true)
  })

  it("should return FetchById when messageId exists in the path", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: "1"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})

    const messageFetcher = createMessageFetcher(event, fetchMessages)

    expect(messageFetcher instanceof FetchById).toBe(true)
  })

  it("should return FetchByExternalCorrelationId when externalCorrelationId exists in the query string", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        externalCorrelationId: "1"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})

    const messageFetcher = createMessageFetcher(event, fetchMessages)

    expect(messageFetcher instanceof FetchByExternalCorrelationId).toBe(true)
  })

  it("should return FetchById when messageId and externalCorrelationId exist in the path and query string", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: "1"
      },
      queryStringParameters: {
        externalCorrelationId: "2"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})

    const messageFetcher = createMessageFetcher(event, fetchMessages)

    expect(messageFetcher instanceof FetchById).toBe(true)
  })

  it("should return messages by status when status parameter exists in the query string", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        status: "Status"
      }
    })
    const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})

    const messageFetcher = createMessageFetcher(event, fetchMessages)

    expect(messageFetcher instanceof FetchByStatus).toBe(true)
  })
})
