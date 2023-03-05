import type { DynamoAuditLog } from "src/shared/types"

export type PaginationOptions = {
  limit?: number
  lastMessage?: DynamoAuditLog
  lastMessageId?: string
}

export type ProjectionOptions = {
  includeColumns?: string[]
  excludeColumns?: string[]
}

export type ReadConsistency = {
  stronglyConsistentRead?: boolean
}

export type RangeQueryOptions = {
  start: Date
  end: Date
}

export type EventsFilterOptions = {
  eventsFilter?: "automationReport" | "topExceptionsReport"
}

export type FetchOneOptions = ProjectionOptions & ReadConsistency
export type FetchManyOptions = PaginationOptions & ProjectionOptions
export type FetchUnsanitisedOptions = PaginationOptions & ProjectionOptions
export type FetchByStatusOptions = PaginationOptions & ProjectionOptions
export type FetchRangeOptions = PaginationOptions & ProjectionOptions & RangeQueryOptions & EventsFilterOptions
export type FetchReportOptions = PaginationOptions & RangeQueryOptions
