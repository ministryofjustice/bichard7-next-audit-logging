import type { AuditLog } from "src/shared/types"

export type PaginationOptions = {
  limit?: number
  lastMessage?: AuditLog
  lastMessageId?: string
}

export type ProjectionOptions = {
  includeColumns?: string[]
  excludeColumns?: string[]
}

export type RangeQueryOptions = {
  start: Date
  end: Date
}

export type FetchManyOptions = PaginationOptions & ProjectionOptions
export type FetchUnsanitisedOptions = PaginationOptions & ProjectionOptions
export type FetchByStatusOptions = PaginationOptions & ProjectionOptions
export type FetchRangeOptions = PaginationOptions & ProjectionOptions & RangeQueryOptions
export type FetchReportOptions = PaginationOptions & RangeQueryOptions
