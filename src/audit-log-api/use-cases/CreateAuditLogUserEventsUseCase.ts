import type { AuditLogDynamoGatewayInterface } from "src/audit-log-api/gateways/dynamo"
import type { ApiAuditLogEvent, CreateAuditLogEventsResult, DynamoAuditLogUserEvent } from "src/shared/types"
import { isError } from "src/shared/types"
import shouldLogForAutomationReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"

const convertApiEventToDynamo = (event: ApiAuditLogEvent, userName: string): DynamoAuditLogUserEvent => ({
  ...event,
  _automationReport: shouldLogForAutomationReport(event) ? 1 : 0,
  _topExceptionsReport: shouldLogForTopExceptionsReport(event) ? 1 : 0,
  user: userName
})

export default class CreateAuditLogUserEventsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  async create(userName: string, events: ApiAuditLogEvent | ApiAuditLogEvent[]): Promise<CreateAuditLogEventsResult> {
    const newEvents = Array.isArray(events) ? events : [events]

    const newDynamoEvents = newEvents.map((event) => convertApiEventToDynamo(event, userName))

    const transactionResult = await this.auditLogGateway.createManyUserEvents(newDynamoEvents)

    if (isError(transactionResult)) {
      return {
        resultType: "error",
        resultDescription: transactionResult.message
      }
    }

    return { resultType: "success" }
  }
}
