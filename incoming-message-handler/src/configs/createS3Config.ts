import type { S3Config } from "shared-types"

export default function createS3Config(): S3Config {
  return {
    url: process.env.AWS_URL,
    region: process.env.AWS_REGION,
    bucketName: process.env.INCOMING_MESSAGE_BUCKET_NAME
  }
}
