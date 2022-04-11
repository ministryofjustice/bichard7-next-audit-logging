import type { S3GatewayInterface, PromiseResult, AuditLog, BichardAuditLogEvent } from "shared-types"
import { isError } from "shared-types"

export default class DeleteMessageObjectsFromS3UseCase {
  constructor(private readonly gateway: S3GatewayInterface) {}

  async call(message: AuditLog): PromiseResult<void> {
    const s3Path = message?.s3Path

    if (s3Path) {
      const deleteObjectFromS3Result = await this.gateway.deleteItem(s3Path)
      if (isError(deleteObjectFromS3Result)) {
        return deleteObjectFromS3Result
      }
    }

    // Delete event objects from S3
    for (const auditLogEvent of message.events) {
      const { s3Path: eventS3Path } = auditLogEvent as BichardAuditLogEvent
      const deleteEventObjectFromS3Result = await this.gateway.deleteItem(eventS3Path)
      if (isError(deleteEventObjectFromS3Result)) {
        return deleteEventObjectFromS3Result
      }
    }
  }
}
