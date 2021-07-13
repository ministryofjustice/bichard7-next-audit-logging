import { APIGatewayProxyEvent } from "aws-lambda"
import { FakeAuditLogDynamoGateway } from "@bichard/testing"
import FetchAll from "./FetchAll"
import FetchById from "./FetchById"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchByStatus from "./FetchByStatus"
import createMessageFetcher from "./createMessageFetcher"

const gateway = new FakeAuditLogDynamoGateway()

describe("createMessageFetcher()", () => {
  it("should return FetchAll when there are no path or query string parameters", () => {
    const event = <APIGatewayProxyEvent>{}

    const messageFetcher = createMessageFetcher(event, gateway)

    expect(messageFetcher instanceof FetchAll).toBe(true)
  })

  it("should return FetchById when messageId exists in the path", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: "1"
      }
    })

    const messageFetcher = createMessageFetcher(event, gateway)

    expect(messageFetcher instanceof FetchById).toBe(true)
  })

  it("should return FetchByExternalCorrelationId when externalCorrelationId exists in the query string", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        externalCorrelationId: "1"
      }
    })

    const messageFetcher = createMessageFetcher(event, gateway)

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

    const messageFetcher = createMessageFetcher(event, gateway)

    expect(messageFetcher instanceof FetchById).toBe(true)
  })

  it("should return messages by status when status parameter exists in the query string", () => {
    const event = <APIGatewayProxyEvent>(<unknown>{
      queryStringParameters: {
        status: "Status"
      }
    })

    const messageFetcher = createMessageFetcher(event, gateway)

    expect(messageFetcher instanceof FetchByStatus).toBe(true)
  })
})
