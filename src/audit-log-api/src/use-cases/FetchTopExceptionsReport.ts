import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { FetchReportOptions } from "src/types/queryParams"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchTopExceptionsReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: FetchReportOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)
    if (isError(lastMessage)) {
      return lastMessage
    }

    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["topExceptionsReport"],
      excludeColumns: ["events"],
      lastMessage
    })

    if (isError(records)) {
      return records
    }

    return records.map((record) => {
      record.events = []

      if (record.topExceptionsReport) {
        record.events = record.topExceptionsReport.events
        delete record.topExceptionsReport
      }

      return record
    })
  }
}
