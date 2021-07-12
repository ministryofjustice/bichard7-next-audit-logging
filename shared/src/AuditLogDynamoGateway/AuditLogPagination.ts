import AuditLog from "src/types/AuditLog"
import Pagination from "src/DynamoGateway/Pagination"
import { KeyValuePair } from "src/types"

export default class AuditLogPagination {
  constructor(private limit = 10) {}

  private createPagination(itemKeyValues: KeyValuePair<string, unknown>, lastMessage?: AuditLog) {
    const pagination: Pagination = {
      limit: this.limit
    }

    if (lastMessage) {
      pagination.lastItemKey = {
        messageId: lastMessage.messageId,
        ...itemKeyValues
      }
    }

    return pagination
  }

  createDefaultPagination(lastMessage?: AuditLog): Pagination {
    return this.createPagination(
      {
        _: "_",
        receivedDate: lastMessage?.receivedDate
      },
      lastMessage
    )
  }

  createStatusPagination(lastMessage?: AuditLog): Pagination {
    return this.createPagination(
      {
        status: lastMessage?.status,
        receivedDate: lastMessage?.receivedDate
      },
      lastMessage
    )
  }
}
