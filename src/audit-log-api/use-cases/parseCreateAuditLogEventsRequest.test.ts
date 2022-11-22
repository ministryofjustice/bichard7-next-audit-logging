import type { APIGatewayProxyEvent } from "aws-lambda"
import { ApiAuditLogEvent, isError } from "src/shared/types"
import type { ParseCreateAuditLogEventsRequestResult } from "./parseCreateAuditLogEventsRequest"
import parseCreateAuditLogEventsRequest from "./parseCreateAuditLogEventsRequest"

const expectedAuditLogEvent = [
  {
    category: "information",
    timestamp: new Date().toISOString(),
    eventType: "Test parsing request",
    eventSource: "Test",
    attributes: {},
    eventCode: "test.event.code"
  }
] as ApiAuditLogEvent[]

const expectedMessageId = "0197bffc-fbf0-4ddd-9324-462d224c6c2e"

test("should return audit log event and messageId when request body has value and messageId is in path", () => {
  const result = parseCreateAuditLogEventsRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(expectedAuditLogEvent),
    pathParameters: <unknown>{
      messageId: expectedMessageId
    }
  })

  expect(isError(result)).toBe(false)

  const { messageId, auditLogEvents } = <ParseCreateAuditLogEventsRequestResult>result
  expect(messageId).toBe(messageId)
  expect(auditLogEvents).toBeDefined()
  expect(auditLogEvents[0]).toBeDefined()
  expect(auditLogEvents[0].category).toBe(expectedAuditLogEvent[0].category)
  expect(auditLogEvents[0].timestamp).toBe(expectedAuditLogEvent[0].timestamp)
  expect(auditLogEvents[0].eventType).toBe(expectedAuditLogEvent[0].eventType)
})

test("should return error when request body is empty", () => {
  const result = parseCreateAuditLogEventsRequest(<APIGatewayProxyEvent>{
    body: null,
    pathParameters: <unknown>{
      messageId: expectedMessageId
    }
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Body cannot be empty.")
})

test("should return error when request body is not valid", () => {
  const result = parseCreateAuditLogEventsRequest(<APIGatewayProxyEvent>{
    body: "Invalid format",
    pathParameters: <unknown>{
      messageId: expectedMessageId
    }
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Unexpected token I in JSON at position 0")
})

test("should return error when messageId is not in path", () => {
  const result = parseCreateAuditLogEventsRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(expectedAuditLogEvent)
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Message Id must be provided in the URL.")
})
