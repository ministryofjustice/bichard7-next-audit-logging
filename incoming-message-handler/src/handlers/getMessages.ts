import { isError, PromiseResult } from "@handlers/common"
import { APIGatewayProxyResult } from "aws-lambda"
import { createDynamoDbConfig } from "src/configs"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import FetchMessagesUseCase from "src/use-cases/FetchMessagesUserCase"

const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "AuditLog")
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
