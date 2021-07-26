import type { AWSError, S3 } from "aws-sdk"
import type { PromiseResult } from "aws-sdk/lib/request"
import type { Result } from "shared"

const parseGetObjectResponse = (
  response: PromiseResult<S3.GetObjectOutput, AWSError>,
  objectKey: string
): Result<string> => response.Body?.toString("utf-8") ?? Error(`Content is empty for key ${objectKey}.`)

export default parseGetObjectResponse
