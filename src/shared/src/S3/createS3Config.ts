import type { S3Config } from "shared-types"

export default (bucketEnvVar: string | null = null): S3Config => {
  const { S3_URL, S3_REGION, S3_AWS_ACCESS_KEY_ID, S3_AWS_SECRET_ACCESS_KEY } = process.env

  if (!S3_URL) {
    throw new Error("S3_URL environment variable must have a value")
  }

  if (!S3_REGION) {
    throw new Error("S3_REGION environment variable must have a value")
  }

  const config: S3Config = {
    url: S3_URL,
    region: S3_REGION
  }

  if (bucketEnvVar) {
    const bucketName = process.env[bucketEnvVar]
    if (!bucketName) {
      throw new Error(`${bucketEnvVar} environment variable must have a value`)
    }
    config.bucketName = bucketName
  }

  if (S3_AWS_ACCESS_KEY_ID) {
    config.accessKeyId = S3_AWS_ACCESS_KEY_ID
  }
  if (S3_AWS_SECRET_ACCESS_KEY) {
    config.secretAccessKey = S3_AWS_SECRET_ACCESS_KEY
  }

  return config
}
