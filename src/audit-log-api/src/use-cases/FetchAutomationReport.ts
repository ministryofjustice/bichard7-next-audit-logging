import type { AuditLog, AuditLogDynamoGateway, PromiseResult, RangeQueryOptions } from "shared-types"
import { isError } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchAutomationReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: RangeQueryOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["automationReport"],
      excludeColumns: ["events"]
    })

    if (isError(records)) {
      return records
    }

    return records.map((record) => {
      record.events = []

      if (record.automationReport) {
        record.events = record.automationReport.events
        delete record.automationReport
      }

      return record
    })
  }
}
