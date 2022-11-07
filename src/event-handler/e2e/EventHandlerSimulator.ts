// eslint-disable-next-line import/no-extraneous-dependencies
import { StepFunctionSimulator } from "src/shared/testing"
import storeEvent from "../handlers/storeEvent"

export default class {
  private readonly stateMachine: StepFunctionSimulator

  constructor() {
    this.stateMachine = new StepFunctionSimulator([storeEvent])
  }

  getStoreEventOutput() {
    return this.stateMachine.getOutput(0)
  }

  async start(s3ObjectKey: string, executionId: string): Promise<void> {
    await this.stateMachine.execute({
      id: executionId,
      detail: {
        requestParameters: {
          bucketName: "auditLogEventsBucket",
          key: s3ObjectKey
        }
      }
    })
  }
}
