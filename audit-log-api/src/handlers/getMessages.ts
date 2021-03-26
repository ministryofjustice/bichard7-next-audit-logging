import { isError, PromiseResult, AuditLogDynamoGateway } from "shared"
import { APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import FetchMessagesUseCase from "src/use-cases"

const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "audit-log")
const fetchMessages = new FetchMessagesUseCase(auditLogGateway)

export default async function getMessages(): PromiseResult<APIGatewayProxyResult> {
  const messages = await fetchMessages.get()

  if (isError(messages)) {
    return {
      statusCode: 500,
      body: String(messages)
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ messages })
  }
}
