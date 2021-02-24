import { SQSRecord } from "aws-lambda"
import MqGateway from "../gateways/MqGateway"

class SendRecordsUseCase {
  constructor(private gateway: MqGateway) {}

  async sendRecords(records: SQSRecord[]): Promise<void> {
    const results = await Promise.allSettled(
      records.map(async (record) => this.gateway.execute(JSON.stringify(record)))
    )
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult
    if (rejected) {
      throw rejected.reason
    }
  }
}

export default SendRecordsUseCase
