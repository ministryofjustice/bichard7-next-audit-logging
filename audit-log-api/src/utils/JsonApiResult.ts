import { APIGatewayProxyResult } from "aws-lambda"

interface Props {
  statusCode: number
  body: string | unknown
}

export default function createJSONApiResult(props: Props): APIGatewayProxyResult {
  const body = typeof props.body === "string" ? <string>props.body : JSON.stringify(props.body)

  return {
    statusCode: props.statusCode,
    body,
    headers: {
      "content-type": "application/json"
    }
  }
}
