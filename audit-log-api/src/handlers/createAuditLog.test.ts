import "src/testConfig"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog, HttpStatusCode } from "shared"
import CreateAuditLogUseCase from "src/use-cases/CreateAuditLogUseCase"
import createAuditLog from "./createAuditLog"

const createHandlerEvent = (item?: AuditLog): APIGatewayProxyEvent => {
  let auditLog = item
  if (!auditLog) {
    auditLog = new AuditLog("1", new Date(), "XML")
    auditLog.caseId = "Case ID"
    auditLog.createdBy = "Create audit log test"
  }

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(auditLog)
  }
}

describe("createAuditlog()", () => {
  it("should return 201 Created status code when Audit Log Id does not exist in the database", async () => {
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should return 400 Bad request status code when Audit Log validation fails", async () => {
    const event = createHandlerEvent({} as AuditLog)
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe(
      "Case ID is mandatory, External Correlation ID is mandatory, Message ID is mandatory, Message XML is mandatory, Received date is mandatory, Created by is mandatory"
    )
  })

  it("should respond with 400 Conflict status code when there is a log with the same Audit Log Id in the database", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "conflict",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.conflict)
    expect(actualResponse.body).toBe(expectedMessage)
  })

  it("should respond with a 500 Internal Server Error status code when an unhandled error occurs", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "error",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe(expectedMessage)
  })
})
