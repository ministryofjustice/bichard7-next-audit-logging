import { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog, HttpStatusCode } from "shared"
import CreateAuditLogUseCase from "src/use-cases/CreateAuditLogUseCase"
import createAuditLog from "./createAuditLog"

const createHandlerEvent = (): APIGatewayProxyEvent => {
  const auditLog = new AuditLog("1", new Date(), "XML")

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(auditLog)
  }
}

describe("createAuditlog()", () => {
  it("should return 201 Created status code when Audit Log Id does not exist in the database", async () => {
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(Promise.resolve())

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should respond with 400 Conflict status code when there is a log with the same Audit Log Id in the database", async () => {
    const expectedError = new Error("Expected Message")
    expectedError.name = "conflict"
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(Promise.resolve(expectedError))

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.conflict)
    expect(actualResponse.body).toBe(expectedError.message)
  })

  it("should respond with a 500 Internal Server Error status code when an unhandled error occurs", async () => {
    const expectedError = new Error("Expected Message")
    expectedError.name = "error"
    jest.spyOn(CreateAuditLogUseCase.prototype, "create").mockReturnValue(Promise.resolve(expectedError))

    const event = createHandlerEvent()
    const actualResponse = await createAuditLog(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe(expectedError.message)
  })
})
