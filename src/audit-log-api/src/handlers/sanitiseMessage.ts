import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AwsAuditLogDynamoGateway, AwsS3Gateway, createS3Config, HttpStatusCode } from "shared"
import type { AuditLog, PromiseResult } from "shared-types"
import createDynamoDbConfig from "../createDynamoDbConfig"
import createMessageFetcher from "../use-cases/createMessageFetcher"
import DeleteEventXmlFromS3UseCase from "../use-cases/DeleteEventXmlFromS3UseCase"
import { createJsonApiResult } from "../utils"

const config = createDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const awsS3Gateway = new AwsS3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const deleteEventXmlFromS3UseCase = new DeleteEventXmlFromS3UseCase(awsS3Gateway)

/* eslint-disable require-await */
export default async function sanitiseMessage(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const messageFetcher = createMessageFetcher(event, auditLogGateway)
  const messageFetcherResult = await messageFetcher.fetch()
  if (messageFetcherResult) {
    const message = messageFetcherResult as AuditLog
    const s3Path = message?.events[0].s3Path // Find out why it fails casting to AuditLog

    if(s3Path){
      await deleteEventXmlFromS3UseCase.call(s3Path)
    }
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.noContent,
    body: ""
  })
}
