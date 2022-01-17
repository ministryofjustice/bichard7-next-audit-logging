import { isError } from "shared-types"
import type { S3PutObjectEvent } from "shared-types"
import { AuditLogApiClient, AwsS3Gateway, createS3Config } from "shared"
import translateEvent from "src/use-cases/translateEvent"
import type { TranslateEventInput } from "../types"
import CreateEventUseCase from "src/use-cases/CreateEventUseCase"
import RetrieveEventFromS3UseCase from "src/use-cases/RetrieveEventFromS3UseCase"

const apiUrl = process.env.API_URL
if (!apiUrl) {
  throw new Error("API_URL environment variable is not set")
}

const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error("API_KEY environment variable is not set")
}

const s3Gateway = new AwsS3Gateway(createS3Config())
const retrieveEventFromS3UseCase = new RetrieveEventFromS3UseCase(s3Gateway)
const api = new AuditLogApiClient(apiUrl, apiKey)
const createEventUseCase = new CreateEventUseCase(api)

export default async function storeEvent(event: S3PutObjectEvent): Promise<void> {
  const retrieveEventFromS3Result = await retrieveEventFromS3UseCase.execute(event)

  if (isError(retrieveEventFromS3Result)) {
    throw retrieveEventFromS3Result
  }

  const translateEventResult = await translateEvent(retrieveEventFromS3Result as unknown as TranslateEventInput)

  if (isError(translateEventResult)) {
    throw translateEventResult
  }

  const { messageId, event: messageEvent } = translateEventResult

  const createEventResult = await createEventUseCase.execute(messageId, messageEvent)

  if (isError(createEventResult)) {
    throw createEventResult
  }
}
