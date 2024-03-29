import type { DynamoAuditLog, PromiseResult, S3GatewayInterface } from "src/shared/types"
import { isError } from "src/shared/types"

export default class DeleteMessageObjectsFromS3UseCase {
  constructor(private readonly messagesGateway: S3GatewayInterface) {}

  async call(message: DynamoAuditLog): PromiseResult<void> {
    const s3Path = message?.s3Path

    if (s3Path) {
      const deleteObjectFromS3Result = await this.messagesGateway.deleteItem(s3Path)
      if (isError(deleteObjectFromS3Result)) {
        return deleteObjectFromS3Result
      }
    }
  }
}
