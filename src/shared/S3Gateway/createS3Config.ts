import type { S3Config } from "src/shared/types"

export default (bucketEnvVar: string | null = null): S3Config => {
  const { S3_URL, S3_REGION, S3_AWS_ACCESS_KEY_ID, S3_AWS_SECRET_ACCESS_KEY } = process.env

  const config: S3Config = {
    ...(S3_URL ? { url: S3_URL } : {}),
    ...(S3_AWS_ACCESS_KEY_ID ? { accessKeyId: S3_AWS_ACCESS_KEY_ID } : {}),
    ...(S3_AWS_SECRET_ACCESS_KEY ? { secretAccessKey: S3_AWS_SECRET_ACCESS_KEY } : {}),
    region: S3_REGION ?? "eu-west-2"
  }

  if (bucketEnvVar) {
    const bucketName = process.env[bucketEnvVar]
    if (!bucketName) {
      throw new Error(`${bucketEnvVar} environment variable must have a value`)
    }
    config.bucketName = bucketName
  }

  return config
}
