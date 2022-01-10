import type { S3Config } from "shared-types"

export default (): S3Config => {
  const { S3_URL, S3_REGION, EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME } = process.env

  if (!S3_URL) {
    throw new Error("S3_URL environment variable must have value")
  }

  if (!S3_REGION) {
    throw new Error("S3_REGION environment variable must have value")
  }

  if (!EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME) {
    throw new Error("EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME environment variable must have value")
  }

  return {
    url: S3_URL,
    region: S3_REGION,
    bucketName: EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME
  }
}
