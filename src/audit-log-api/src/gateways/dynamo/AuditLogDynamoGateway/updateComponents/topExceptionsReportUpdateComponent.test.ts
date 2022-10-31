import type { AuditLogEvent } from "shared-types"
import topExceptionsReportUpdateComponent from "./topExceptionsReportUpdateComponent"

const topExceptionEvent = (): AuditLogEvent => {
  return {
    eventType: "top exception event",
    eventCode: "exceptions.generated",
    attributes: {
      "Error Details": "error"
    }
  } as unknown as AuditLogEvent
}

const nonTopExceptionEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("topExceptionsReportUpdateComponent", () => {
  it("should add an event to top exceptions array when necessary", () => {
    const events = [nonTopExceptionEvent(), nonTopExceptionEvent(), topExceptionEvent(), nonTopExceptionEvent()]
    const forceOwnerDynamoUpdates = topExceptionsReportUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression:
        "topExceptionsReport.events = list_append(if_not_exists(topExceptionsReport.events, :empty_list), :topExceptionEvents)",
      updateExpressionValues: { ":topExceptionEvents": [topExceptionEvent()] }
    })
  })

  it("shouldn't change anything in dynamodb when the no events should be in the top exceptions report", () => {
    const events = [nonTopExceptionEvent(), nonTopExceptionEvent(), nonTopExceptionEvent()]
    const forceOwnerDynamoUpdates = topExceptionsReportUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
