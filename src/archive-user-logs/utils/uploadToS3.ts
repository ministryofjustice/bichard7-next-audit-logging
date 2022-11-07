import type { PromiseResult, S3GatewayInterface } from "src/shared/types"
import type { Event } from "../types"

const generateObjectPath = (data: Event): string => {
  const date = new Date()
  const formatedDate = date.toLocaleDateString("en-GB").split("/").reverse().join("") // '20211124'

  return `${data.logGroup}/${formatedDate}/${data.logStream}/${data.logEvents[0].timestamp}`
}

export const uploadToS3 = (data: Event, bucket: string, s3Gateway: S3GatewayInterface): PromiseResult<void> => {
  const objectKey = generateObjectPath(data)
  return s3Gateway.forBucket(bucket).upload(objectKey, JSON.stringify(data))
}
