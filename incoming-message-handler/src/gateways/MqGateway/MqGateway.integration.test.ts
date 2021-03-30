import { isError } from "shared"
import { MqConfig } from "src/configs"
import MqGateway from "./MqGateway"
import TestMqGateway from "./TestMqGateway"

const queueName = "mq-gateway-integration-testing"
const config = new MqConfig("localhost", 51613, "admin", "admin", queueName)

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
