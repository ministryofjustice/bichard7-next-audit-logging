import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLogEvent, isError } from "shared"
import type { ParseCreateAuditLogEventRequestResult } from "./parseCreateAuditLogEventRequest"
import parseCreateAuditLogEventRequest from "./parseCreateAuditLogEventRequest"

const expectedAuditLogEvent = new AuditLogEvent({
  category: "information",
  timestamp: new Date(),
  eventType: "Test parsing request",
  eventSource: "Test"
})
const expectedMessageId = "0197bffc-fbf0-4ddd-9324-462d224c6c2e"

test("should return audit log event and messageId when request body has value and messageId is in path", () => {
  const result = parseCreateAuditLogEventRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(expectedAuditLogEvent),
    pathParameters: <unknown>{
      messageId: expectedMessageId
    }
  })

  expect(isError(result)).toBe(false)

  const { messageId, auditLogEvent } = <ParseCreateAuditLogEventRequestResult>result
  expect(messageId).toBe(messageId)
  expect(auditLogEvent).toBeDefined()
  expect(auditLogEvent.category).toBe(expectedAuditLogEvent.category)
  expect(auditLogEvent.timestamp).toBe(expectedAuditLogEvent.timestamp)
  expect(auditLogEvent.eventType).toBe(expectedAuditLogEvent.eventType)
})

test("should return error when request body is empty", () => {
  const result = parseCreateAuditLogEventRequest(<APIGatewayProxyEvent>{
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
  const result = parseCreateAuditLogEventRequest(<APIGatewayProxyEvent>{
    body: "Invalid format",
    pathParameters: <unknown>{
      messageId: expectedMessageId
    }
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Unexpected token I in JSON at position 0")
})

test("should not return error when messageId is not in path", () => {
  const result = parseCreateAuditLogEventRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(expectedAuditLogEvent)
  })

  expect(isError(result)).toBe(false)
})
