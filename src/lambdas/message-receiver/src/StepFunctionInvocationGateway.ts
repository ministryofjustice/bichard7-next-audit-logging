// eslint-disable-next-line import/no-extraneous-dependencies
import { StepFunctions } from "aws-sdk"
import { v4 as uuid } from "uuid"
import type { PromiseResult } from "shared"
import type StepFunctionConfig from "./StepFunctionConfig"

export default class StepFunctionInvocationGateway {
  private readonly stateMachine: StepFunctions

  private readonly stateMachineArn: string

  constructor({ awsUrl, region, stateMachineArn }: StepFunctionConfig) {
    this.stateMachine = new StepFunctions({
      endpoint: awsUrl,
      region
    })

    this.stateMachineArn = stateMachineArn
  }

  execute<TPayload>(payload: TPayload): PromiseResult<void> {
    return this.stateMachine
      .startExecution({
        stateMachineArn: this.stateMachineArn,
        input: JSON.stringify(payload),
        name: `message-receiver-${uuid()}`
      })
      .promise()
      .catch((error) => error)
  }
}
