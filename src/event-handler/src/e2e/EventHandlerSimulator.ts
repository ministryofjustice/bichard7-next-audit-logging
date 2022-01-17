import { StepFunctionSimulator } from "shared-testing"
import storeEvent from "src/handlers/storeEvent"

export default class {
  private readonly stateMachine: StepFunctionSimulator

  constructor() {
    this.stateMachine = new StepFunctionSimulator([storeEvent])
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
