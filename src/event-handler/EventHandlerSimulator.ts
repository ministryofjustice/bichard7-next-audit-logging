import { StepFunctions } from "aws-sdk"

export default class {
  private readonly stateMachine: StepFunctions

  constructor(awsUrl: string) {
    this.stateMachine = new StepFunctions({
      endpoint: awsUrl,
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
      }
    })
  }

  async start(s3ObjectKey: string): Promise<void> {
    const executionName = s3ObjectKey.replace(/\//g, "_").slice(-80)
    await this.stateMachine
      .startExecution({
        stateMachineArn: "arn:aws:states:us-east-1:000000000000:stateMachine:BichardEventHandler",
        input: `{
          "detail": {
            "requestParameters": {
              "bucketName": "audit-log-events",
              "key": "${s3ObjectKey}"
            }
          }
        }`,
        name: executionName
      })
      .promise()
  }
}
