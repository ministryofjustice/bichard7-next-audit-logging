import { isError } from "@handlers/common"
import { createS3Config } from "./configs"
import { S3PutObjectEvent } from "./entities"
import S3Gateway from "./gateways/S3Gateway"
import HandleMessageUseCase from "./use-cases/HandleMessageUseCase"

const s3Config = createS3Config()
const s3Gateway = new S3Gateway(s3Config)

const handleMessage = new HandleMessageUseCase()

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: S3PutObjectEvent): Promise<string> => {
  const { bucketName, key } = event.detail.requestParameters
  const message = await s3Gateway.getItem(bucketName, key)

  if (isError(message)) {
    throw message
  }

  const result = await handleMessage.handle(message)

  if (isError(result)) {
    throw result
  }

  return result
}
