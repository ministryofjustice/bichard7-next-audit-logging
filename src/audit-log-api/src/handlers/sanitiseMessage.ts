import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode } from "shared"
import type { PromiseResult } from "shared-types"
import { createJsonApiResult } from "../utils"

/* eslint-disable require-await */
export default async function sanitiseMessage(_event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  return createJsonApiResult({
    statusCode: HttpStatusCode.noContent,
    body: ""
  })
}
