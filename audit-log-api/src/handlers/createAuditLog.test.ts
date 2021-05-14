jest.mock("src/createDynamoDbConfig")

import createDynamoDbConfig from "src/createDynamoDbConfig"

const mockedCreateDynamoDbConfig = <jest.Mock<typeof createDynamoDbConfig>>(<unknown>createDynamoDbConfig)
mockedCreateDynamoDbConfig.mockReturnValue(
  () =>
    <DynamoDbConfig>{
      DYNAMO_URL: "dummy",
      DYNAMO_REGION: "dummy",
      AUDIT_LOG_TABLE_NAME: "dummy"
    }
)

import { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLog, DynamoDbConfig, HttpStatusCode } from "shared"
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
