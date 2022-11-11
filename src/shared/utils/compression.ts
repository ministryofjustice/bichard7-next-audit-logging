import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import { promisify } from "util"
import { deflate, inflate } from "zlib"

const inflateAsync = promisify(inflate)
const deflateAsync = promisify(deflate)

const compress = async (rawData: string): PromiseResult<string> => {
  if (rawData === "") {
    return ""
  }

  const result = await deflateAsync(rawData).catch((error: Error) => error)

  if (isError(result)) {
    return result
  }

  return result.toString("base64")
}

const decompress = async (compressedData: string): PromiseResult<string> => {
  if (compressedData === "") {
    return ""
  }
  const result = await inflateAsync(Buffer.from(compressedData, "base64")).catch((error: Error) => error)

  if (isError(result)) {
    return result
  }

  return result.toString()
}

export { compress, decompress }
