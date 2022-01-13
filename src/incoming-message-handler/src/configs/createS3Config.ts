import type { S3Config } from "shared-types"

export default function createS3Config(): S3Config {
  return {
    url: process.env.S3_URL,
    region: process.env.AWS_REGION,
    bucketName: process.env.INCOMING_MESSAGE_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}
