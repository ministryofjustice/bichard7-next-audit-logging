import { EventMessage } from "shared"

interface StoreInS3Result extends EventMessage {
  s3Path: string
}

export default async (message: EventMessage): Promise<StoreInS3Result> => {
  await Promise.resolve()

  // TODO: Store in S3.
  // TODO: Return S3 path.
  console.log(message)

  const s3Path = ""

  return {
    ...message,
    s3Path
  }
}
