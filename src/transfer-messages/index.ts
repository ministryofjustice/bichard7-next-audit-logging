import { createS3Config, logger, S3Gateway } from "src/shared"
import { isError } from "src/shared/types"
import TransferMessagesUseCase from "./TransferMessagesUseCase"
import type { TransferMessagesInput, TransferMessagesOptions, TransferMessagesResult } from "./types"

const { CONDUCTOR_INCOMING_MESSAGE_BUCKET, INTERNAL_INCOMING_MESSAGES_BUCKET } = process.env
if (!CONDUCTOR_INCOMING_MESSAGE_BUCKET || !INTERNAL_INCOMING_MESSAGES_BUCKET) {
  throw new Error("INCOMING_MESSAGE_BUCKET_NAME environment variables must have values")
}

export default async ({
  numberOfObjectsToTransfer,
  destinationBucket
}: TransferMessagesInput): Promise<TransferMessagesResult> => {
  const { CANARY_RATIO } = process.env
  const canaryRatio = CANARY_RATIO ? Number(CANARY_RATIO) : 0.0
  const externalBucketGateway = new S3Gateway(createS3Config("EXTERNAL_INCOMING_MESSAGES_BUCKET"))
  const transferMessages = new TransferMessagesUseCase(
    externalBucketGateway,
    INTERNAL_INCOMING_MESSAGES_BUCKET,
    CONDUCTOR_INCOMING_MESSAGE_BUCKET,
    canaryRatio,
    destinationBucket
  )

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
