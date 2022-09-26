import type { S3Config } from "shared-types"

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

export { auditLogEventsS3Config, externalIncomingS3Config, internalIncomingS3Config }
