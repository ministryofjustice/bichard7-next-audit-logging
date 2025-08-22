import type { SSM } from "aws-sdk"
import { isError } from "src/shared/types"

const getSSMParameter = async (ssm: SSM, paramName: string, paramDescription: string): Promise<string> => {
  const result = await ssm
    .getParameter({ Name: paramName, WithDecryption: true })
    .promise()
    .catch((error: Error) => error)

  if (isError(result)) {
    throw result
  }

  const value = result.Parameter?.Value

  if (!value) {
    throw Error(`Couldn't retrieve ${paramDescription} from SSM`)
  }

  return value
}

export default getSSMParameter
