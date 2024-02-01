import { S3Gateway } from "src/shared"
import { StepFunctionSimulator } from "src/shared/testing"
import type { KeyValuePair } from "src/shared/types"
import { isError } from "src/shared/types"
import recordSentToBichardEvent from "../handlers/recordSentToBichardEvent"
import sendToBichard from "../handlers/sendToBichard"
import storeMessage from "../handlers/storeMessage"

const validateStoreMessage = (input: KeyValuePair<string, unknown>) => {
  if ("validationResult" in input) {
    const { isValid, isDuplicate } = input.validationResult as { isValid: boolean; isDuplicate: boolean }
    if (isValid === false || isDuplicate === true) {
      return { __next_step: null }
    }
  }

  return input
}

export default class IncomingMessageSimulator {
  private readonly s3Gateway: S3Gateway

  private readonly stateMachine: StepFunctionSimulator

  constructor() {
    this.s3Gateway = new S3Gateway({
      url: "http://localhost:4569",
      region: "eu-west-2",
      bucketName: "internalIncomingBucket",
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER"
    })

    this.stateMachine = new StepFunctionSimulator([
      storeMessage,
      validateStoreMessage,
      sendToBichard,
      recordSentToBichardEvent
    ])
  }

  async start(fileName: string, message: string, executionId: string): Promise<void> {
    const result = await this.s3Gateway.upload(fileName, message)

    if (isError(result)) {
      throw result
    }

    await this.stateMachine.execute({
      id: executionId,
      detail: {
        requestParameters: {
          bucketName: "internalIncomingBucket",
          key: fileName
        }
      }
    })
  }
}
