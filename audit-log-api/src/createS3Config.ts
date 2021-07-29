import type { S3Config } from "@bichard/s3"

export default function createS3Config(): S3Config {
  const { AUDIT_LOG_EVENTS_BUCKET } = process.env

  if (!AUDIT_LOG_EVENTS_BUCKET) {
    throw Error("AUDIT_LOG_EVENTS_BUCKET environment variable must have value.")
  }

  return {
    url: process.env.AWS_URL,
    region: process.env.AWS_REGION,
    bucketName: AUDIT_LOG_EVENTS_BUCKET
  }
}
