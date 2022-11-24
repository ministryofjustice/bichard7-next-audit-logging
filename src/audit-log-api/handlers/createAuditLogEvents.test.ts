import type { APIGatewayProxyEvent } from "aws-lambda"
import { HttpStatusCode } from "src/shared"
import { mockApiAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent } from "src/shared/types"
import "../testConfig"
import { CreateAuditLogEventsUseCase } from "../use-cases"
import createAuditLogEvents from "./createAuditLogEvents"

const createHandlerEvent = (...auditLogEvents: ApiAuditLogEvent[]): APIGatewayProxyEvent => {
  const events = auditLogEvents || [mockApiAuditLogEvent()]

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(events),
    pathParameters: <unknown>{
      messageId: "1f5a462b-781d-4805-bbcb-51c2c0d1a8ee" // Random messageId
    }
  }
}

describe("createAuditLogEvents()", () => {
  it("should return Created status when a single event is added to the audit log in the database", async () => {
    jest.spyOn(CreateAuditLogEventsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should return Created status when many events are added to the audit log in the database", async () => {
    jest.spyOn(CreateAuditLogEventsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const auditLogEvents = new Array(10).fill(0).map(() => mockApiAuditLogEvent())
    const event = createHandlerEvent(...auditLogEvents)
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
  })

  it("should return Bad request status when a single audit log event is not valid", async () => {
    const event = createHandlerEvent({} as ApiAuditLogEvent)
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(() => JSON.parse(actualResponse.body)).not.toThrow()
    const jsonResponse = JSON.parse(actualResponse.body)
    expect(jsonResponse).toStrictEqual([
      {
        eventTimestamp: "No event timestamp given",
        isValid: false,
        errors: [
          "Category is mandatory",
          "Event source is mandatory",
          "Event type is mandatory",
          "Timestamp is mandatory"
        ]
      }
    ])
  })

  it("should return Bad request status when a one audit log event among many is not valid", async () => {
    const events = new Array(10).fill(0).map(() => mockApiAuditLogEvent())
    events.splice(4, 0, {} as ApiAuditLogEvent)
    const handlerEvent = createHandlerEvent(...events)
    const actualResponse = await createAuditLogEvents(handlerEvent)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)

    const expectedResponses = events.map((event) => {
      if (event.timestamp !== undefined) {
        return {
          isValid: true,
          eventTimestamp: event.timestamp,
          errors: []
        }
      } else {
        return {
          eventTimestamp: "No event timestamp given",
          isValid: false,
          errors: [
            "Category is mandatory",
            "Event source is mandatory",
            "Event type is mandatory",
            "Timestamp is mandatory"
          ]
        }
      }
    })

    expect(() => JSON.parse(actualResponse.body)).not.toThrow()
    const jsonResponse = JSON.parse(actualResponse.body)
    expect(jsonResponse).toStrictEqual(expectedResponses)
  })

  it("should respond with an Not Found status when message id does not exist", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogEventsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "notFound",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.notFound)
    expect(actualResponse.body).toBe(expectedMessage)
  })

  it("should respond with an Internal Server Error status when an unhandled error occurs", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogEventsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "error",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe(expectedMessage)
  })

  it("should respond with a Conflict status when the message version is different", async () => {
    const expectedMessage = "Expected Message"
    jest.spyOn(CreateAuditLogEventsUseCase.prototype, "create").mockReturnValue(
      Promise.resolve({
        resultType: "invalidVersion",
        resultDescription: expectedMessage
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.conflict)
    expect(actualResponse.body).toBe(expectedMessage)
  })
})
