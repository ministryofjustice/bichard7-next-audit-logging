import { isError } from "shared"
import { StepFunctions } from "aws-sdk"
import S3Gateway from "src/gateways/S3Gateway"

export default class IncomingMessageSimulator {
  private readonly s3Gateway: S3Gateway

  private readonly stateMachine: StepFunctions

  constructor(awsUrl: string) {
    this.s3Gateway = new S3Gateway({
      S3_URL: awsUrl,
      S3_REGION: "us-east-1",
      INCOMING_MESSAGE_BUCKET_NAME: "incoming-messages",
      S3_FORCE_PATH_STYLE: "true"
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
