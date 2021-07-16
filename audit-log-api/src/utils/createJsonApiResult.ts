import type { APIGatewayProxyResult } from "aws-lambda"

interface ResultOptions {
  statusCode: number
  body: string | unknown
}

export default function createJsonApiResult(options: ResultOptions): APIGatewayProxyResult {
  const body = typeof options.body === "string" ? <string>options.body : JSON.stringify(options.body)

  return {
    statusCode: options.statusCode,
    body,
    headers: {
      "content-type": "application/json"
    }
  }
}
