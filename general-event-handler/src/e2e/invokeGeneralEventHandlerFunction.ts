import { Lambda } from "aws-sdk"
import { InvocationRequest } from "aws-sdk/clients/lambda"
import { PromiseResult } from "shared"

const invokeGeneralEventHandlerFunction = (payload: string): PromiseResult<Lambda.InvocationResponse> => {
  const lambda = new Lambda({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test"
    }
  })

  const params = <InvocationRequest>{
    FunctionName: "GeneralEventHandler",
    Payload: payload
  }

  return lambda.invoke(params).promise()
}

export default invokeGeneralEventHandlerFunction
