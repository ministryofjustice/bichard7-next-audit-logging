import "src/testConfig"
import { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLogEvent, HttpStatusCode } from "shared"
import { CreateAuditLogEventUseCase } from "src/use-cases"
import createAuditLogEvent from "./createAuditLogEvent"

const createHandlerEvent = (): APIGatewayProxyEvent => {
  const event = new AuditLogEvent({
    category: "information",
    timestamp: new Date(),
    eventType: "Test event",
    eventSource: "Test"
  })

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(event),
    pathParameters: <unknown>{
      messageId: "1f5a462b-781d-4805-bbcb-51c2c0d1a8ee" // Random messageId
    }
  }
}

describe("createAuditLogEvent()", () => {
  it("should return Created status when event is added to the audit log in the database", async () => {
    jest.spyOn(CreateAuditLogEventUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvent(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should respond with an Not Found status when message id does not exist", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogEventUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "notFound",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvent(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.notFound)
    expect(actualResponse.body).toBe(expectedMessage)
  })

  it("should respond with an Internal Server Error status when an unhandled error occurs", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogEventUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "error",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvent(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe(expectedMessage)
  })
})
