import { isError } from "shared-types"
import type { AmazonMqEventSourceRecordEvent, MessageFormat } from "shared-types"
import { AwsS3Gateway } from "shared"
import embellishMessages from "./embellishMessages"
import StoreInS3UseCase from "./StoreInS3UseCase"
import createS3Config from "./createS3Config"

const messageFormat = process.env.MESSAGE_FORMAT as MessageFormat
if (!messageFormat) {
  throw new Error("MESSAGE_FORMAT is either unset or an unsupported value")
}

const s3Gateway = new AwsS3Gateway(createS3Config())
const useCase = new StoreInS3UseCase(s3Gateway)

export default async (event: AmazonMqEventSourceRecordEvent): Promise<void> => {
  if (!event.messages || event.messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  const messages = embellishMessages(event, messageFormat)

  await Promise.all(
    messages.map(async (message) => {
      const result = await useCase.execute(message)

      if (isError(result)) {
        throw result
      }
    })
  )
}
