import AuditLog from "src/AuditLog"
import Pagination from "src/DynamoGateway/Pagination"

export default class AuditLogPagination {
  constructor(private limit = 10) {}

  createDefaultPagination(lastMessage?: AuditLog): Pagination {
    const pagination: Pagination = {
      limit: this.limit
    }

    if (lastMessage) {
      pagination.lastItemKey = {
        messageId: lastMessage.messageId,
        _: "_",
        receivedDate: lastMessage.receivedDate
      }
    }

    return pagination
  }

  createStatusPagination(lastMessage?: AuditLog): Pagination {
    const pagination: Pagination = {
      limit: this.limit
    }

    if (lastMessage) {
      pagination.lastItemKey = {
        messageId: lastMessage.messageId,
        status: lastMessage.status,
        receivedDate: lastMessage.receivedDate
      }
    }

    return pagination
  }
}
