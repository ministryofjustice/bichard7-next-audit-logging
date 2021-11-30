import { isError } from "shared"
import type { S3PutObjectEvent, EventMessage } from "shared"
import { AwsS3Gateway } from "@bichard/s3"
import createS3Config from "./createS3Config"

export interface RetrieveEventFromS3Result extends EventMessage {
  s3Path: string
}

const s3Gateway = new AwsS3Gateway(createS3Config())

export default async function retrieveEventFromS3(event: S3PutObjectEvent): Promise<RetrieveEventFromS3Result> {
  const { bucketName, key } = event.detail.requestParameters

  const messageData = await s3Gateway.forBucket(bucketName).getItem(key)

  if (isError(messageData)) {
    throw messageData
  }

  const message = JSON.parse(messageData)

  return {
    ...message,
    s3Path: key
  }
}
