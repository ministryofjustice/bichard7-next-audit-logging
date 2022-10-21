import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { FetchReportOptions } from "src/types/queryParams"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { parseForceOwner } from "../gateways/dynamo"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchTopExceptionsReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGatewayInterface, private readonly options: FetchReportOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)
    if (isError(lastMessage)) {
      return lastMessage
    }

    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["automationReport"],
      lastMessage
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
