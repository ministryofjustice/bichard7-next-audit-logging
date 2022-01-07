import type { S3 } from "aws-sdk"
import type { PromiseResult } from "shared"
import { isError } from "shared"
import type { S3Gateway } from "@bichard/s3"
import type { FailedItem, TransferMessageResult, TransferMessagesOptions, TransferMessagesResult } from "./types"

export default class TransferMessagesUseCase {
  constructor(private readonly externalBucketGateway: S3Gateway, private readonly internalS3BucketName: string) {}

  async getMessages(numberOfMessagesToReturn?: number): PromiseResult<S3.Object[]> {
    const messages = await this.externalBucketGateway.list()

    if (isError(messages)) {
      return messages
    }

    const sortedMessages = messages
      .filter((item: S3.Object) => !!item.Key && !!item.LastModified)
      .sort((itemA: S3.Object, itemB: S3.Object) => (itemA.LastModified! > itemB.LastModified! ? 1 : -1))

    if (numberOfMessagesToReturn) {
      return sortedMessages.slice(0, numberOfMessagesToReturn)
    }

    return sortedMessages
  }

  async transferMessage(message: S3.Object): Promise<TransferMessageResult> {
    const copyItemResult = await this.externalBucketGateway.copyItemTo(message.Key!, this.internalS3BucketName)

    if (isError(copyItemResult)) {
      return { failedToCopyError: copyItemResult }
    }

    const deleteItemResult = await this.externalBucketGateway.deleteItem(message.Key!)

    if (isError(deleteItemResult)) {
      return { failedToDeleteError: deleteItemResult }
    }

    return {}
  }

  async transferMessages(messages: S3.Object[]): Promise<TransferMessagesResult> {
    const successful: string[] = []
    const failedToCopy: FailedItem[] = []
    const failedToDelete: FailedItem[] = []

    const transferItems = messages.map(async (message: S3.Object): Promise<void> => {
      const { failedToCopyError, failedToDeleteError } = await this.transferMessage(message)

      if (failedToCopyError) {
        failedToCopy.push({ key: message.Key!, error: failedToCopyError.message })
      }

      if (failedToDeleteError) {
        failedToDelete.push({ key: message.Key!, error: failedToDeleteError.message })
      }

      if (!failedToCopyError && !failedToDeleteError) {
        successful.push(message.Key!)
      }
    })

    await Promise.allSettled(transferItems)

    return { successful, failedToCopy, failedToDelete }
  }

  async execute({ numberOfObjectsToTransfer }: TransferMessagesOptions): PromiseResult<TransferMessagesResult> {
    const messages = await this.getMessages(numberOfObjectsToTransfer)

    if (isError(messages)) {
      return messages
    }

    const result = await this.transferMessages(messages)

    return result
  }
}
