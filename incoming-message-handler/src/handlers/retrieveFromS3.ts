import { isError } from "@handlers/common"
import { createS3Config } from "../configs"
import { S3PutObjectEvent, ReceivedMessage } from "../entities"
import S3Gateway from "../gateways/S3Gateway"

const s3Gateway = new S3Gateway(createS3Config())

export default async function retrieveFromS3(event: S3PutObjectEvent): Promise<ReceivedMessage> {
  const { bucketName, key } = event.detail.requestParameters
  const message = await s3Gateway.getItem(bucketName, key)

  if (isError(message)) {
    throw message
  }

  return {
    // TODO: Parse ReceivedDate from object key.
    receivedDate: new Date(),
    messageXml: message
  }
}
