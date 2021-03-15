import { isError } from "@handlers/common"
import { createDynamoDbConfig, createS3Config } from "./configs"
import { IncomingMessage, S3PutObjectEvent } from "./entities"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import S3Gateway from "./gateways/S3Gateway"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"
import HandleMessageUseCase from "./use-cases/HandleMessageUseCase"

const incomingMessageGateway = new IncomingMessageDynamoGateway(createDynamoDbConfig(), "IncomingMessage")
const persistMessage = new PersistMessageUseCase(incomingMessageGateway)

const s3Config = createS3Config()
const s3Gateway = new S3Gateway(s3Config)

const handleMessage = new HandleMessageUseCase(persistMessage)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: S3PutObjectEvent): Promise<IncomingMessage> => {
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
