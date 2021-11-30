import type { S3Config } from "@bichard/s3"

export default (): S3Config => {
  const { S3_URL, S3_REGION } = process.env

  if (!S3_URL) {
    throw new Error("S3_URL environment variable must have value")
  }

  if (!S3_REGION) {
    throw new Error("S3_REGION environment variable must have value")
  }

  return {
    url: S3_URL,
    region: S3_REGION
  }
}
