import { isError, S3Gateway } from "shared"
import { StepFunctions } from "aws-sdk"

export default class IncomingMessageSimulator {
  private readonly s3Gateway: S3Gateway

  private readonly stateMachine: StepFunctions

  constructor(awsUrl: string) {
    this.s3Gateway = new S3Gateway({
      url: awsUrl,
      region: "us-east-1",
      bucketName: "incoming-messages"
    })

    this.stateMachine = new StepFunctions({
      endpoint: awsUrl,
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
      }
    })
  }

  async start(fileName: string, message: string): Promise<void> {
    const result = await this.s3Gateway.upload(fileName, message)

    if (isError(result)) {
      throw result
    }

    const executionName = fileName.replace(/\//g, "_")
    await this.stateMachine
      .startExecution({
        stateMachineArn: "arn:aws:states:us-east-1:000000000000:stateMachine:IncomingMessageHandler",
        input: `{
          "detail": {
            "requestParameters": {
              "bucketName": "incoming-messages",
              "key": "${fileName}"
            }
          }
        }`,
        name: executionName
      })
      .promise()
  }
}
