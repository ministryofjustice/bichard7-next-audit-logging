import { SQSEvent } from "aws-lambda"
import SendRecordsUseCase from "./use-cases/sendRecords"
import { createMqConfig } from "./utils/Config"
import MqGateway from "./gateways/MqGateway"

const gateway = new MqGateway(createMqConfig())
const sendRecordsUseCase = new SendRecordsUseCase(gateway)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  const { Records } = event
  await sendRecordsUseCase.sendRecords(Records)
}
