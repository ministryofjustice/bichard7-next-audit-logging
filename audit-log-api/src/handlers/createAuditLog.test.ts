import { APIGatewayProxyResult } from "aws-lambda"
import { AuditLog, AuditLogDynamoGateway } from "shared"
import createAuditLog from "./createAuditLog"

const log = new AuditLog("1", new Date(2021, 10, 12), "XML")
log.caseId = "123"

const expectedSuccessfulBodyResponse = "Created"
const expectedErrorBodyResponse = `A message with Id ${log.messageId} already exists in the database`

describe("createAuditlog()", () => {
  it("should return 'Created' status code (201)", async () => {
    jest.spyOn(AuditLogDynamoGateway.prototype, "create").mockReturnValue(
      new Promise<AuditLog>((resolve) => {
        resolve(log)
      })
    )

    const createAuditLogResponse = await createAuditLog(log)
    const actualResponse = <APIGatewayProxyResult>createAuditLogResponse
    expect(actualResponse.statusCode).toBe(201)
    expect(actualResponse.body).toBe(expectedSuccessfulBodyResponse)
  })

  it("should respond with error", async () => {
    const error = new Error("The conditional request failed")
    jest.spyOn(AuditLogDynamoGateway.prototype, "create").mockReturnValue(
      new Promise<Error>((resolve) => {
        resolve(error)
      })
    )

    const createAuditLogResponse = await createAuditLog(log)
    const actualResponse = <APIGatewayProxyResult>createAuditLogResponse

    expect(actualResponse.statusCode).toBe(500)
    expect(actualResponse.body).toBe(expectedErrorBodyResponse)
  })
})
