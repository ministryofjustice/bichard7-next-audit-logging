import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { FetchReportOptions } from "../types/queryParams"
import { parseForceOwner } from "../utils"
import type MessageFetcher from "./MessageFetcher"

export default class FetchAutomationReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGatewayInterface, private readonly options: FetchReportOptions) {}

  async fetch(): PromiseResult<DynamoAuditLog[]> {
    let lastMessage: DynamoAuditLog | undefined

    if (this.options.lastMessageId) {
      const result = await this.gateway.fetchOne(this.options.lastMessageId)

      if (isError(result)) {
        return result
      }

      lastMessage = result
    }

    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["automationReport"],
      lastMessage,
      eventsFilter: "automationReport"
    })

    if (isError(records)) {
      return records
    }

    return records.map((record) => {
      if (record.automationReport) {
        record.events = (record.events ?? [])
          .concat(record.automationReport.events)
          .sort((a, b) => (a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0))
        if (!record.forceOwner && record.automationReport.forceOwner) {
          record.forceOwner = parseForceOwner(record.automationReport.forceOwner)
        }
        delete record.automationReport
      }

      return record
    })
  }
}
