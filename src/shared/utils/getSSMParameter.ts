import type { SSM } from "aws-sdk"

type SSMResult = {
  value?: string
  error?: Error
}

const getSSMParameter = async (ssm: SSM, paramName: string, paramDescription: string): Promise<SSMResult> => {
  try {
    const result = await ssm.getParameter({ Name: paramName, WithDecryption: true }).promise()
    const value = result.Parameter?.Value
    if (!value) {
      return { error: new Error(`Couldn't retrieve ${paramDescription} from SSM`) }
    }
    return { value }
  } catch (error) {
    return { error: error as Error }
  }
}

export default getSSMParameter
