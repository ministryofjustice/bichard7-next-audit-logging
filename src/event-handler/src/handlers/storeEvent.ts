import { AuditLogApiClient, createS3Config, logger, S3Gateway } from "shared"
import type { S3PutObjectEvent } from "shared-types"
import { isError } from "shared-types"
import CreateEventUseCase from "src/use-cases/CreateEventUseCase"
import DoesS3ObjectExist from "src/use-cases/DoesS3ObjectExist"
import RetrieveEventFromS3UseCase from "src/use-cases/RetrieveEventFromS3UseCase"
import translateEvent from "src/use-cases/translateEvent"

const apiUrl = process.env.API_URL
if (!apiUrl) {
  throw new Error("API_URL environment variable is not set")
}

const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error("API_KEY environment variable is not set")
}

const s3Gateway = new S3Gateway(createS3Config())
const doesS3ObjectExistUseCase = new DoesS3ObjectExist(s3Gateway)
const retrieveEventFromS3UseCase = new RetrieveEventFromS3UseCase(s3Gateway)
const api = new AuditLogApiClient(apiUrl, apiKey, 5_000)
const createEventUseCase = new CreateEventUseCase(api)

interface StoreEventResult {
  bucketName: string
  s3Path: string
}

interface StoreEventValidationResult {
  validationResult: {
    s3ObjectNotFound: boolean
  }
}

export default async function storeEvent(
  event: S3PutObjectEvent
): Promise<StoreEventResult | StoreEventValidationResult> {
  const { key: s3Path, bucketName } = event.detail.requestParameters
  const s3ObjectExists = await doesS3ObjectExistUseCase.execute(event)

  if (isError(s3ObjectExists)) {
    throw s3ObjectExists
  }

  if (!s3ObjectExists) {
    logger.info(`EventHandler.S3ObjectNotFound, bucket: ${bucketName} key: ${s3Path}`)
    return { validationResult: { s3ObjectNotFound: true } }
  }

  const retrieveEventFromS3Result = await retrieveEventFromS3UseCase.execute(event)

  if (isError(retrieveEventFromS3Result)) {
    throw retrieveEventFromS3Result
  }

  const translateEventResult = await translateEvent(retrieveEventFromS3Result)

  if (isError(translateEventResult)) {
    throw translateEventResult
  }

  const { messageId, event: messageEvent } = translateEventResult
  logger.info(`[${messageId}] - Logging event - ${messageEvent.eventType} (${messageEvent.eventCode})`)

  const createEventResult = await createEventUseCase.execute(messageId, messageEvent)

  if (isError(createEventResult)) {
    throw createEventResult
  }

  return { bucketName, s3Path }
}
