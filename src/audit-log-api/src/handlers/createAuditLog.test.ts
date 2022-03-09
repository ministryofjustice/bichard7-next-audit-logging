import "../testConfig"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog } from "shared-types"
import { HttpStatusCode } from "shared"
import CreateAuditLogUseCase from "../use-cases/CreateAuditLogUseCase"
import createAuditLog from "./createAuditLog"
import { validateCreateAuditLog } from "src/use-cases"

jest.mock("src/use-cases/validateCreateAuditLog")

const mockedValidateCreateAuditLog = validateCreateAuditLog as jest.MockedFunction<typeof validateCreateAuditLog>

const createHandlerEvent = (item?: AuditLog): APIGatewayProxyEvent => {
  let auditLog = item
  if (!auditLog) {
    auditLog = new AuditLog("1", new Date(), "Dummy hash")
    auditLog.caseId = "Case ID"
    auditLog.createdBy = "Create audit log test"
  }

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(auditLog)
  }
}

describe("createAuditlog()", () => {
  it("should return 201 Created status code when Audit Log Id does not exist in the database", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLog: {} as AuditLog })
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
    mockedValidateCreateAuditLog.mockResolvedValue({
      isValid: false,
      errors: ["Dummy error 1", "Dummy error 2"],
      auditLog: {} as AuditLog
    })
    const event = createHandlerEvent({} as AuditLog)
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe("Dummy error 1, Dummy error 2")
  })

  it("should respond with 400 Conflict status code when there is a log with the same Audit Log Id in the database", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLog: {} as AuditLog })
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
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLog: {} as AuditLog })
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
