import { isError } from "shared-types"
import { AwsS3Gateway } from "shared"
import createS3Config from "./createS3Config"
import TransferMessagesUseCase from "./TransferMessagesUseCase"
import type { TransferMessagesInput, TransferMessagesOptions, TransferMessagesResult } from "./types"

const externalBucketGateway = new AwsS3Gateway(createS3Config())
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

  // eslint-disable-next-line no-console
  console.log(result)
  return result
}
