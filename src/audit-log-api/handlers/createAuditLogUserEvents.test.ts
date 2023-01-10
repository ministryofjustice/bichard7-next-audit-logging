import type { APIGatewayProxyEvent } from "aws-lambda"
import { mockApiAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent } from "src/shared/types"
import { HttpStatusCode } from "src/shared"
import "../testConfig"
import { CreateAuditLogUserEventsUseCase } from "../use-cases"
import createAuditLogUserEvents from "./createAuditLogUserEvents"

const createHandlerEvent = (...auditLogEvents: ApiAuditLogEvent[]): APIGatewayProxyEvent => {
  const events = auditLogEvents || [mockApiAuditLogEvent()]

  return <APIGatewayProxyEvent>{
    body: JSON.stringify(events),
    pathParameters: <unknown>{
      userName: "user.name" // Random userId
    }
  }
}

describe("createAuditLogUserEvents", () => {
  let mockCreateAuditLogUserEventsUseCase: jest.SpyInstance

  beforeEach(() => {
    mockCreateAuditLogUserEventsUseCase = jest.spyOn(CreateAuditLogUserEventsUseCase.prototype, "create")
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should return Created status when a single event is added to the audit log in the database", async () => {
    mockCreateAuditLogUserEventsUseCase.mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
    expect(mockCreateAuditLogUserEventsUseCase).toHaveBeenCalledWith("user.name", [])
  })

  it("should return Bad Request status when no userName is provided", async () => {
    const event = createHandlerEvent()
    delete event.pathParameters?.userName
    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe("UserName cannot be null.")
    expect(mockCreateAuditLogUserEventsUseCase).not.toHaveBeenCalled()
  })
})
