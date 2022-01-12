import type { S3Config } from "shared-types"

export default (): S3Config => {
  const { S3_URL, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env

  if (!S3_URL) {
    throw new Error("S3_URL environment variable must have value")
  }

  if (!S3_REGION) {
    throw new Error("S3_REGION environment variable must have value")
  }

  return {
    url: S3_URL,
    region: S3_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
}
