import { S3Config } from "shared"

export default (): S3Config => ({
  url: process.env.AWS_URL,
  region: process.env.AWS_REGION,
  bucketName: process.env.EVENTS_BUCKET_NAME
})
