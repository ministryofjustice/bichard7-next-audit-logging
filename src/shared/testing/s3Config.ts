import type { S3Config } from "src/shared/types"

const auditLogEventsS3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const externalIncomingS3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "externalIncomingBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const internalIncomingS3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "internalIncomingBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const conductorIncomingS3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "conductorIncomingBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

export { auditLogEventsS3Config, conductorIncomingS3Config, externalIncomingS3Config, internalIncomingS3Config }
