import type { AuditLogDynamoGatewayInterface } from "src/audit-log-api/gateways/dynamo"
import type { ApiAuditLogEvent, CreateAuditLogEventsResult } from "src/shared/types"

export default class CreateAuditLogUserEventsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  create(_: string, __: ApiAuditLogEvent | ApiAuditLogEvent[]): Promise<CreateAuditLogEventsResult> {
    console.log(this.auditLogGateway)
    return Promise.resolve({ resultType: "success" })
  }
}
