import { SQSEvent } from "aws-lambda"
import { isError } from "@handlers/common"
import { createDynamoDbConfig, createMqConfig } from "./types"
import MqGateway from "./gateways/MqGateway"
import IncomingMessage from "./entities/IncomingMessage"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"
import SendMessageUseCase from "./use-cases/SendMessageUseCase"

const gateway = new MqGateway(createMqConfig())
const sendMessageUseCase = new SendMessageUseCase(gateway)

// TODO: Move the config into environment variables.
const incomingMessageGateway = new IncomingMessageDynamoGateway(createDynamoDbConfig(), "IncomingMessage")
const persistMessage = new PersistMessageUseCase(incomingMessageGateway)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  if (event.Records.length === 0) {
    // Nothing to do
    return
  }

  const record = event.Records[0].body

  // TODO: Merge with message parsing/formatting.
  const incomingMessage = new IncomingMessage(record, new Date())
  const persistMessageResult = await persistMessage.persist(incomingMessage)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  const sendMessageResult = await sendMessageUseCase.send(undefined)
  if (isError(sendMessageResult)) {
    throw sendMessageResult
  }
}
