import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog, isError } from "shared-types"
import parseCreateAuditLogRequest from "./parseCreateAuditLogRequest"

test("should return audit log when request body has value", () => {
  const expectedDate = new Date()
  const result = parseCreateAuditLogRequest(<APIGatewayProxyEvent>{
    body: JSON.stringify(new AuditLog("123", expectedDate, "Xml"))
  })

  expect(isError(result)).toBe(false)

  const auditLog = <AuditLog>result
  expect(auditLog.externalCorrelationId).toBe("123")
  expect(auditLog.messageXml).toBe("Xml")
  expect(auditLog.receivedDate).toBe(expectedDate.toISOString())
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
