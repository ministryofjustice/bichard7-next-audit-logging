import type { APIGatewayProxyEvent } from "aws-lambda"
import { mockInputApiAuditLog } from "src/shared/testing"
import { InputApiAuditLog, isError } from "src/shared/types"
import parseCreateAuditLogRequest from "./parseCreateAuditLogRequest"

test("should return audit log when request body has value", () => {
  const auditLog = mockInputApiAuditLog()
  const result = parseCreateAuditLogRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(auditLog)
  })

  expect(isError(result)).toBe(false)

  const auditLogResult = <InputApiAuditLog>result
  expect(auditLogResult.externalCorrelationId).toBe(auditLog.externalCorrelationId)
  expect(auditLogResult.receivedDate).toBe(auditLog.receivedDate)
})

test("should return error when request body is empty", () => {
  const result = parseCreateAuditLogRequest(<APIGatewayProxyEvent>{
    body: null
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Body cannot be empty.")
})

test("should return error when request body is not valid", () => {
  const result = parseCreateAuditLogRequest(<APIGatewayProxyEvent>{
    body: "Invalid format"
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Unexpected token I in JSON at position 0")
})
