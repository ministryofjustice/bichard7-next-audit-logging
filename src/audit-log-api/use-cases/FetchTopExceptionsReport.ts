import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { FetchReportOptions } from "../types/queryParams"
import { parseForceOwner } from "../utils"
import type MessageFetcher from "./MessageFetcher"

export default class FetchTopExceptionsReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGatewayInterface, private readonly options: FetchReportOptions) {}

  async fetch(): PromiseResult<DynamoAuditLog[]> {
    let lastMessage: DynamoAuditLog | undefined

    if (this.options.lastMessageId) {
      const result = await this.gateway.fetchOne(this.options.lastMessageId, {
        includeColumns: ["isSanitised", "nextSanitiseCheck"]
      })

      if (isError(result)) {
        return result
      }

      lastMessage = result
    }

    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["automationReport"],
      lastMessage,
      eventsFilter: "topExceptionsReport"
    })

    if (isError(records)) {
      return records
    }

    return records.map((record) => {
      record.events = record.events.filter((e) => e.attributes && "Error 1 Details" in e.attributes)

      if (record.automationReport) {
        if (!record.forceOwner && record.automationReport.forceOwner) {
          record.forceOwner = parseForceOwner(record.automationReport.forceOwner)
        }
        delete record.automationReport
      }

      return record
    })
  }
}
