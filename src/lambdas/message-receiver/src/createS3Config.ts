import type { S3Config } from "shared-types"

export default (): S3Config => {
  const { S3_URL, S3_REGION, EVENTS_BUCKET_NAME } = process.env

  if (!S3_URL) {
    throw new Error("S3_URL environment variable must have value")
  }

  if (!S3_REGION) {
    throw new Error("S3_REGION environment variable must have value")
  }

  if (!EVENTS_BUCKET_NAME) {
    throw new Error("EVENTS_BUCKET_NAME environment variable must have value")
  }

  return {
    url: S3_URL,
    region: S3_REGION,
    bucketName: EVENTS_BUCKET_NAME
  }
}
