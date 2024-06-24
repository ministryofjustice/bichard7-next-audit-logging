import type { APIGatewayProxyEvent } from "aws-lambda"
import { HttpStatusCode } from "src/shared"
import { mockApiAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent } from "src/shared/types"
import "../testConfig"
import { CreateAuditLogUserEventsUseCase, validateCreateAuditLogEvents } from "../use-cases"
import createAuditLogUserEvents from "./createAuditLogUserEvents"
jest.mock("./src/audit-log-api/use-cases/validateCreateAuditLogEvents.ts")

const mockedValidateCreateAuditLogEvents = validateCreateAuditLogEvents as jest.MockedFunction<
  typeof validateCreateAuditLogEvents
>

const createHandlerEvent = (...auditLogEvents: ApiAuditLogEvent[]): APIGatewayProxyEvent => {
  const events = auditLogEvents.length > 0 ? auditLogEvents : [mockApiAuditLogEvent()]

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
    mockedValidateCreateAuditLogEvents.mockReturnValue({
      isValid: true,
      eventValidationResults: []
    })
    mockCreateAuditLogUserEventsUseCase.mockReturnValue(
      Promise.resolve({
        resultType: "success"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.created)
    expect(actualResponse.body).toBe("Created")
    expect(mockCreateAuditLogUserEventsUseCase).toHaveBeenCalledWith("user.name", expect.anything())
  })

  it("should return Internal Server Error when use case returns an unknown error", async () => {
    mockedValidateCreateAuditLogEvents.mockReturnValue({
      isValid: true,
      eventValidationResults: []
    })
    mockCreateAuditLogUserEventsUseCase.mockReturnValue(
      Promise.resolve({
        resultType: "unknown error",
        resultDescription: "Unknown error"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toBe("Unknown error")
    expect(mockCreateAuditLogUserEventsUseCase).toHaveBeenCalledWith("user.name", [])
  })

  it("should return a specific error when use case returns a known error", async () => {
    mockedValidateCreateAuditLogEvents.mockReturnValue({
      isValid: true,
      eventValidationResults: []
    })
    mockCreateAuditLogUserEventsUseCase.mockReturnValue(
      Promise.resolve({
        resultType: "transactionFailed",
        resultDescription: "Transaction failed"
      })
    )

    const event = createHandlerEvent()
    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.conflict)
    expect(actualResponse.body).toBe("Transaction failed")
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

  it("should return Bad Request status when body is not provided", async () => {
    const event = {
      ...createHandlerEvent(),
      body: null
    }

    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe("Body cannot be empty.")
    expect(mockCreateAuditLogUserEventsUseCase).not.toHaveBeenCalled()
  })

  it("should return Bad Request status when body is malformed json", async () => {
    const event = {
      ...createHandlerEvent(),
      body: "Invalid JSON"
    }

    const actualResponse = await createAuditLogUserEvents(event)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toBe("Could not parse body. Unexpected token 'I', \"Invalid JSON\" is not valid JSON")
    expect(mockCreateAuditLogUserEventsUseCase).not.toHaveBeenCalled()
  })

  it("should return Bad request status when one event is not valid", async () => {
    const actualEventValidationResults = [
      { timestamp: "2023-01-11T11:08:34.663Z", errors: [], auditLogEvent: {} as ApiAuditLogEvent },
      {
        timestamp: "No event timestamp given",
        errors: [
          "Category is mandatory",
          "Event source is mandatory",
          "Event type is mandatory",
          "Timestamp is mandatory"
        ],
        auditLogEvent: {} as ApiAuditLogEvent
      }
    ]
    mockedValidateCreateAuditLogEvents.mockReturnValue({
      isValid: false,
      eventValidationResults: actualEventValidationResults
    })

    const handlerEvent = createHandlerEvent({} as ApiAuditLogEvent)
    const actualResponse = await createAuditLogUserEvents(handlerEvent)

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    const jsonResponseBody = JSON.parse(actualResponse.body)
    expect(jsonResponseBody).toStrictEqual([
      { eventTimestamp: "2023-01-11T11:08:34.663Z", errors: [], isValid: true },
      {
        eventTimestamp: "No event timestamp given",
        errors: [
          "Category is mandatory",
          "Event source is mandatory",
          "Event type is mandatory",
          "Timestamp is mandatory"
        ],
        isValid: false
      }
    ])
    expect(mockCreateAuditLogUserEventsUseCase).not.toHaveBeenCalled()
  })
})
