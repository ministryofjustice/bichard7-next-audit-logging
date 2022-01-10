import type { S3Config } from "shared-types"

export default function createS3Config(): S3Config {
  const { AUDIT_LOG_EVENTS_BUCKET } = process.env

  if (!AUDIT_LOG_EVENTS_BUCKET) {
    throw Error("AUDIT_LOG_EVENTS_BUCKET environment variable must have value.")
  }

  return {
    url: process.env.S3_URL,
    region: process.env.S3_REGION,
    bucketName: AUDIT_LOG_EVENTS_BUCKET
  }
}
