import { S3Gateway } from "shared"
import { StepFunctionSimulator } from "shared-testing"
import { isError } from "shared-types"
import retrieveFromS3 from "../handlers/retrieveFromS3"
import formatMessage from "../handlers/formatMessage"
import logMessageReceipt from "../handlers/logMessageReceipt"
import parseMessage from "../handlers/parseMessage"
import recordSentToBichardEvent from "../handlers/recordSentToBichardEvent"
import sendToBichard from "../handlers/sendToBichard"

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
      retrieveFromS3,
      formatMessage,
      parseMessage,
      logMessageReceipt,
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