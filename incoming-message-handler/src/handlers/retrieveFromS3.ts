import { isError } from "shared"
import { createS3Config } from "src/configs"
import { S3PutObjectEvent, ReceivedMessage } from "src/entities"
import S3Gateway from "src/gateways/S3Gateway"
import readReceivedDateFromS3ObjectKey from "src/utils/readReceivedDateFromS3ObjectKey"

const s3Gateway = new S3Gateway(createS3Config())

export default async function retrieveFromS3(event: S3PutObjectEvent): Promise<ReceivedMessage> {
  const { bucketName, key } = event.detail.requestParameters
  const messageXml = await s3Gateway.getItem(bucketName, key)

  if (isError(messageXml)) {
    throw messageXml
  }

  const receivedDate = readReceivedDateFromS3ObjectKey(key)

  return {
    receivedDate,
    messageXml
  }
}
