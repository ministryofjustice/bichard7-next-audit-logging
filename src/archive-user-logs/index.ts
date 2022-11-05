import { createS3Config, S3Gateway } from "src/shared"
import { isError } from "src/shared/types"
import { promisify } from "util"
import { gunzip } from "zlib"
import type { Event } from "./types"
import { ValidEvent, ValidInput } from "./types"
import { uploadToS3 } from "./utils/uploadToS3"

const s3Gateway = new S3Gateway(createS3Config())

export default async (input: unknown): Promise<void> => {
  const parsedInput = ValidInput.safeParse(input)
  if (!parsedInput.success) {
    throw parsedInput.error
  } else {
    // The Data attribute in the Lambda record is base64 encoded and compressed with the gzip format. The actual payload that Lambda receives is in the following format { "awslogs": {"data": "BASE64ENCODED_GZIP_COMPRESSED_DATA"} }
    const payload = Buffer.from(parsedInput.data.awslogs.data, "base64")

    // annoyingly gunzip uses callbacks so do this to use async/ await
    const promisifiedGunzip = promisify(gunzip)

    // decompress a chunk of data
    const result = await promisifiedGunzip(payload)

    const parsedResult: Event = ValidEvent.parse(JSON.parse(result.toString("ascii"))) // zod will throw an error if it doesn't match our data type

    // write to s3 here
    const s3Result = await uploadToS3(parsedResult, process.env.ARCHIVE_USER_LOGS_BUCKET as string, s3Gateway)
    if (isError(s3Result)) {
      throw s3Result
    }
  }
}
