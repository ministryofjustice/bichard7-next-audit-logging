import "../testConfig"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog } from "shared-types"
import { HttpStatusCode } from "shared"
import CreateAuditLogsUseCase from "../use-cases/CreateAuditLogsUseCase"
import createAuditLogs from "./createAuditLogs"
import { validateCreateAuditLogs } from "src/use-cases"

jest.mock("src/use-cases/validateCreateAuditLogs")

const mockedValidateCreateAuditLog = validateCreateAuditLogs as jest.MockedFunction<typeof validateCreateAuditLogs>

const createHandlerEvent = (items?: AuditLog[]): APIGatewayProxyEvent => {
  let auditLogs = items
  if (!auditLogs) {
    const auditLog = new AuditLog("1", new Date(), "Dummy hash")
    auditLog.caseId = "Case ID"
    auditLog.createdBy = "Create audit log test"
    auditLogs = [auditLog]
  }

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(auditLogs)
  }
}

describe("createAuditlog()", () => {
  it("should return 201 Created status code when Audit Log Id does not exist in the database", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLogs: [{}] as AuditLog[] })
    jest.spyOn(CreateAuditLogsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogs(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should return 400 Bad request status code when Audit Log validation fails", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({
      isValid: false,
      errors: ["Dummy error 1", "Dummy error 2"],
      auditLogs: [{}] as AuditLog[]
    })
    const event = createHandlerEvent([{}] as AuditLog[])
    const actualResponse = await createAuditLogs(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe("Dummy error 1, Dummy error 2")
  })

  it("should respond with 400 Conflict status code when there is a log with the same Audit Log Id in the database", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLogs: [{}] as AuditLog[] })
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "conflict",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogs(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.conflict)
    expect(actualResponse.body).toBe(expectedMessage)
  })

  it("should respond with a 500 Internal Server Error status code when an unhandled error occurs", async () => {
    mockedValidateCreateAuditLog.mockResolvedValue({ isValid: true, errors: [], auditLogs: [{}] as AuditLog[] })
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "error",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogs(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe(expectedMessage)
  })
})
