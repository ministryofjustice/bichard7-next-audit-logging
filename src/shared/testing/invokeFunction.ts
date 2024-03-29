import { Lambda } from "aws-sdk"
import type { InvocationRequest, InvocationResponse } from "aws-sdk/clients/lambda"
import type { PromiseResult } from "src/shared/types"

interface InvocationOptions {
  endpoint?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}

export default async <TPayload, TResponse>(
  functionName: string,
  payload: TPayload,
  options?: InvocationOptions
): PromiseResult<TResponse | null> => {
  const lambda = new Lambda({
    endpoint: options?.endpoint || "http://localhost:4566",
    region: options?.region || "us-east-1",
    credentials: {
      accessKeyId: options?.accessKeyId || "test",
      secretAccessKey: options?.secretAccessKey || "test"
    }
  })

  const params = <InvocationRequest>{
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  }

  const response = <InvocationResponse>await lambda.invoke(params).promise()
  const responsePayload = JSON.parse(<string>response.Payload)

  if (!responsePayload) {
    return null
  }

  if (responsePayload.errorMessage) {
    return new Error(responsePayload.errorMessage)
  }

  return <TResponse>responsePayload
}
