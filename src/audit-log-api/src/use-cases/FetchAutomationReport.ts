import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { FetchReportOptions } from "src/types/queryParams"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import { parseForceOwner } from "../gateways/dynamo"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchAutomationReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: FetchReportOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)
    if (isError(lastMessage)) {
      return lastMessage
    }

    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["automationReport"],
      excludeColumns: ["events"],
      lastMessage
    })

    if (isError(records)) {
      return records
    }

    return records.map((record) => {
      record.events = []

      if (record.automationReport) {
        record.events = record.automationReport.events
        if (!record.forceOwner && record.automationReport.forceOwner) {
          record.forceOwner = parseForceOwner(record.automationReport.forceOwner)
        }
        delete record.automationReport
      }

      return record
    })
  }
}
