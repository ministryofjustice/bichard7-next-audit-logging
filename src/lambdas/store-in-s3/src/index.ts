import { EventMessage, isError, S3Gateway } from "shared"
import StoreInS3UseCase from "./StoreInS3UseCase"
import createS3Config from "./createS3Config"

export interface StoreInS3Result extends EventMessage {
  s3Path: string
}

const gateway = new S3Gateway(createS3Config())
const storeInS3 = new StoreInS3UseCase(gateway)

export default async (message: EventMessage): Promise<StoreInS3Result> => {
  const storeResult = await storeInS3.execute(message)

  if (isError(storeResult)) {
    throw storeResult
  }

  return {
    ...message,
    s3Path: storeResult.s3Path
  }
}
