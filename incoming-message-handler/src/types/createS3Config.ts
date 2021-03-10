import S3Config from "./S3Config"

export default function createS3Config(): S3Config {
  return {
    S3_URL: process.env.AWS_URL,
    S3_REGION: process.env.AWS_REGION,
    INCOMING_MESSAGE_BUCKET_NAME: process.env.INCOMING_MESSAGE_BUCKET_NAME,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE
  }
}
