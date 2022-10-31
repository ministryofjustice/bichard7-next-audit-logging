import type { AuditLogEvent } from "shared-types"
import automationRateReportUpdateComponent from "./automationRateReportUpdateComponent"

const automationRateEvent = (): AuditLogEvent => {
  return {
    eventCode: "exceptions.resolved",
    eventType: "Exception marked as resolved by user",
    attributes: {}
  } as unknown as AuditLogEvent
}

const nonAutomationRateEvent = (): AuditLogEvent => {
  return {
    eventCode: "something.else",
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("automationRateReportUpdateComponent", () => {
  it("should add an event to automation events array when necessary", () => {
    const events = [nonAutomationRateEvent(), nonAutomationRateEvent(), automationRateEvent(), nonAutomationRateEvent()]
    const forceOwnerDynamoUpdates = automationRateReportUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression:
        "automationReport.events = list_append(if_not_exists(automationReport.events, :empty_list), :automationReportEvents)",
      updateExpressionValues: { ":automationReportEvents": [automationRateEvent()] }
    })
  })

  it("shouldn't change anything in dynamodb when the no events should be in the automation events report", () => {
    const events = [nonAutomationRateEvent(), nonAutomationRateEvent(), nonAutomationRateEvent()]
    const forceOwnerDynamoUpdates = automationRateReportUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
