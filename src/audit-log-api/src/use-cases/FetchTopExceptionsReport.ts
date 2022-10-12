import type { AuditLog, AuditLogDynamoGateway, PromiseResult, RangeQueryOptions } from "shared-types"
import { isError } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchTopExceptionsReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: RangeQueryOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const records = await this.gateway.fetchRange({
      ...this.options,
      includeColumns: ["topExceptionsReport"],
      excludeColumns: ["events"]
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
