import { SQSRecord } from "aws-lambda"
import { isError } from "@handlers/common"
import MqGateway from "../gateways/MqGateway"

class SendRecordsUseCase {
  constructor(private gateway: MqGateway) {}

  async sendRecords(records: SQSRecord[]): Promise<void> {
    await Promise.allSettled(
      records.map(async (record) => {
        const result = await this.gateway.execute(JSON.stringify(record))

        if (isError(result)) {
          // eslint-disable-next-line no-console
          console.log(result)

          throw result
        }
      })
    )
  }
}

export default SendRecordsUseCase
