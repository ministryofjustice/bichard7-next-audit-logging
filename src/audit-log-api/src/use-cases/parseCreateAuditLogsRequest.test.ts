import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog, isError } from "shared-types"
import parseCreateAuditLogsRequest from "./parseCreateAuditLogsRequest"

test("should return audit log when request body has value", () => {
  const expectedDate = new Date()
  const result = parseCreateAuditLogsRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify([new AuditLog("123", expectedDate, "Dummy hash")])
  })

  expect(isError(result)).toBe(false)

  const [auditLog] = <AuditLog[]>result
  expect(auditLog.externalCorrelationId).toBe("123")
  expect(auditLog.receivedDate).toBe(expectedDate.toISOString())
})

test("should return error when request body is empty", () => {
  const result = parseCreateAuditLogsRequest(<APIGatewayProxyEvent>{
    body: null
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Body cannot be empty.")
})

test("should return error when request body is not valid", () => {
  const result = parseCreateAuditLogsRequest(<APIGatewayProxyEvent>{
    body: "Invalid format"
  })

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Unexpected token I in JSON at position 0")
})
