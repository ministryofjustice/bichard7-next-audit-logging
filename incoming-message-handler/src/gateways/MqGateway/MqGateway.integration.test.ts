import { isError } from "shared"
import { MqConfig } from "src/configs"
import MqGateway, { deconstructServers, parseConnectionOptions } from "./MqGateway"
import TestMqGateway from "./TestMqGateway"

jest.setTimeout(30000)

const queueName = "mq-gateway-integration-testing"
const config: MqConfig = {
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin",
  queueName
}

const gateway = new MqGateway(config)
const testGateway = new TestMqGateway(config)

describe("deconstructServers()", () => {
  it("a single failover", () => {
    const url = "failover:(stomp+ssl://host1:1111)"
    const servers = deconstructServers({
      ...config,
      url
    })

    expect(servers).toHaveLength(1)

    const server = servers[0]
    expect(server.connectHeaders.login).toBe(config.username)
    expect(server.connectHeaders.passcode).toBe(config.password)
  })

  it("2 failovers", () => {
    const url = "failover:(stomp+ssl://host1:1111,stomp+ssl://host2:2222)"
    const servers = deconstructServers({
      ...config,
      url
    })

    expect(servers).toHaveLength(2)

    const server1 = servers[0]
    expect(server1.connectHeaders.login).toBe(config.username)
    expect(server1.connectHeaders.passcode).toBe(config.password)

    const server2 = servers[0]
    expect(server2.connectHeaders.login).toBe(config.username)
    expect(server2.connectHeaders.passcode).toBe(config.password)
  })
})

describe("parseConnectionOptions()", () => {
  it("without ssl", () => {
    const options = parseConnectionOptions("http://localhost:51613")

    expect(options.host).toBe("localhost")
    expect(options.port).toBe(51613)
    expect(options.ssl).toBe(false)
  })

  it("with ssl", () => {
    const options = parseConnectionOptions("stomp+ssl://localhost:51613")

    expect(options.host).toBe("localhost")
    expect(options.port).toBe(51613)
    expect(options.ssl).toBe(true)
  })
})

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
