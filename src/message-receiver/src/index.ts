import { createS3Config, decodeBase64, S3Gateway } from "shared"
import type { AmazonMqEventSourceRecordEvent, EventMessage, MessageFormat } from "shared-types"
import { isError } from "shared-types"
import formatMessages from "./formatMessages"
import StoreInS3UseCase from "./StoreInS3UseCase"

if (!process.env.MESSAGE_FORMAT) {
  throw new Error("MESSAGE_FORMAT is either unset or an unsupported value")
}

const s3Gateway = new S3Gateway(createS3Config("EVENTS_BUCKET_NAME"))
const useCase = new StoreInS3UseCase(s3Gateway)

const extractCorrelationId = (input: string): string | void => {
  const match = input.match(/<correlationID>([^<]*)<\/correlationID>/)
  if (match) {
    return match[1]
  }
}
const extractEventType = (input: string): string | void => {
  const match = input.match(/<eventType>([^<]*)<\/eventType>/)
  if (match) {
    return match[1]
  }
}

const logEvent = (message: EventMessage): void => {
  try {
    const decodedMessage = decodeBase64(message.messageData)
    const messageId = extractCorrelationId(decodedMessage)
    const eventType = extractEventType(decodedMessage)
    console.log(`[${messageId}] - Logging event - ${eventType}`)
  } catch (e) {
    console.log("Error logging message", e)
    console.log("Message: ", message)
  }
}

export default async (event: AmazonMqEventSourceRecordEvent): Promise<void> => {
  if (!event.messages || event.messages.length === 0) {
    throw new Error("No messages were found in the event")
  }
  console.log(`Received ${event?.messages?.length} messages`)

  const messageFormat = process.env.MESSAGE_FORMAT as MessageFormat

  const messages = formatMessages(event, messageFormat)

  if (process.env.MESSAGE_FORMAT === "GeneralEvent") {
    messages.forEach((m) => logEvent(m as EventMessage))
  }

  await Promise.all(
    messages.map(async (message) => {
      const result = await useCase.execute(message, messageFormat)

      if (isError(result)) {
        throw result
      }
    })
  )
}
