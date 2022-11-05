import { createS3Config, logger, S3Gateway } from "src/shared"
import { isError } from "src/shared/types"
import TransferMessagesUseCase from "./TransferMessagesUseCase"
import type { TransferMessagesInput, TransferMessagesOptions, TransferMessagesResult } from "./types"

const externalBucketGateway = new S3Gateway(createS3Config("EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME"))
const internalS3BucketName = process.env.INTERNAL_INCOMING_MESSAGE_BUCKET_NAME

if (!internalS3BucketName) {
  throw new Error("INTERNAL_INCOMING_MESSAGE_BUCKET_NAME environment variable must have value")
}

const transferMessages = new TransferMessagesUseCase(externalBucketGateway, internalS3BucketName)

export default async ({ numberOfObjectsToTransfer }: TransferMessagesInput): Promise<TransferMessagesResult> => {
  if (
    !numberOfObjectsToTransfer ||
    (Number.isNaN(Number(numberOfObjectsToTransfer)) && numberOfObjectsToTransfer !== "all")
  ) {
    throw Error("Provided numberOfObjectsToTransfer is invalid")
  }

  const transferMessagesOptions: TransferMessagesOptions = {}

  if (!Number.isNaN(Number(numberOfObjectsToTransfer))) {
    transferMessagesOptions.numberOfObjectsToTransfer = parseInt(numberOfObjectsToTransfer.toString(), 10)
  }

  const result = await transferMessages.execute(transferMessagesOptions)

  if (isError(result)) {
    throw result
  }

  logger.info(result)

  return result
}
