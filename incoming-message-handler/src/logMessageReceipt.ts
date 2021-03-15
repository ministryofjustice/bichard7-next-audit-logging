import { isError } from "@handlers/common"
import { createDynamoDbConfig } from "./configs"
import { IncomingMessage } from "./entities"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"

const incomingMessageGateway = new IncomingMessageDynamoGateway(createDynamoDbConfig(), "IncomingMessage")
const persistMessage = new PersistMessageUseCase(incomingMessageGateway)

export default async function logMessageReceipt(event: IncomingMessage): Promise<IncomingMessage> {
  const persistMessageResult = await persistMessage.persist(event)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  return event
}
