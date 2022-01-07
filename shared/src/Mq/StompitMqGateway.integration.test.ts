import "shared-testing"
import type { MqConfig } from "shared-types"
import StompitMqGateway from "./StompitMqGateway"
import TestStompitMqGateway from "./TestStompitMqGateway"

jest.setTimeout(30000)

const queueName = "mq-gateway-integration-testing"
const config: MqConfig = {
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin"
}

const gateway = new StompitMqGateway(config)
const testGateway = new TestStompitMqGateway(config)

describe("StompitMqGateway", () => {
  afterAll(async () => {
    await gateway.dispose()
    await testGateway.dispose()
  })

  it("should create the queue and send the message", async () => {
    const expectedMessage = '<?xml version="1.0" ?><root><element>value</element></root>'

    const result = await gateway.execute(expectedMessage, queueName)

    expect(result).toNotBeError()

    const actualMessage = await testGateway.getMessage(queueName)
    expect(actualMessage).toBeDefined()
    expect(actualMessage).toNotBeError()
    expect(actualMessage).toBe(expectedMessage)
  })
})
