jest.retryTimes(10)
import { isError } from "src/shared/types"
import type { MqConfig } from "../../configs"
import MqGateway from "./MqGateway"
import TestMqGateway from "./TestMqGateway"

const queueName = "mq-gateway-integration-testing"
const config: MqConfig = {
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin",
  queueName
}

const gateway = new MqGateway(config)
const testGateway = new TestMqGateway(config)

describe("MqGateway", () => {
  afterAll(async () => {
    await gateway.dispose()
    await testGateway.dispose()
  })

  it("should create the queue and send the message", async () => {
    const expectedMessage = '<?xml version="1.0" ?><root><element>value</element></root>'

    const result = await gateway.execute(expectedMessage)

    expect(isError(result)).toBe(false)

    const actualMessage = await testGateway.getMessage(queueName)
    expect(actualMessage).toBeDefined()
    expect(isError(actualMessage)).toBe(false)
    expect(actualMessage).toBe(expectedMessage)
  })
})
