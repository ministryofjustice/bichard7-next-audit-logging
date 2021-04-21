import { isError, PromiseResult, AuditLogDynamoGateway } from "shared"
import { APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import FetchMessagesUseCase from "src/use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
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
