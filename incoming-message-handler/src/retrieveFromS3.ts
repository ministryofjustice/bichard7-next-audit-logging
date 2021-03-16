import { S3PutObjectEvent, ReceivedMessage } from "./entities"

export default async function retrieveFromS3(event: S3PutObjectEvent): Promise<ReceivedMessage> {
  await Promise.resolve()

  return {
    receivedDate: new Date(),
    messageXml: event.detail.requestParameters.bucketName
  }
}
