import { SQSEvent } from "aws-lambda"
import { createDynamoDbConfig, createMqConfig } from "./types"
import MqGateway from "./gateways/MqGateway"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"
import SendMessageUseCase from "./use-cases/SendMessageUseCase"
import HandleMessageUseCase from "./use-cases/HandleMessageUseCase"

const gateway = new MqGateway(createMqConfig())
const sendMessageUseCase = new SendMessageUseCase(gateway)

// TODO: Move the config into environment variables.
const incomingMessageGateway = new IncomingMessageDynamoGateway(createDynamoDbConfig(), "IncomingMessage")
const persistMessage = new PersistMessageUseCase(incomingMessageGateway)

const handleMessage = new HandleMessageUseCase(persistMessage, sendMessageUseCase)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  if (event.Records.length === 0) {
    // Nothing to do
    return
  }

  const promises = event.Records.map((record) => handleMessage.handle(record.body))
  const results = await Promise.allSettled(promises)

  const failureResult = results.find((result) => result.status === "rejected")
  if (failureResult) {
    const { reason } = <PromiseRejectedResult>failureResult
    throw new Error(reason)
  }
}
