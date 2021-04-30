import { MqConfig } from "src/configs"
import deconstructServers from "./deconstructServers"

const config: MqConfig = {
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin",
  queueName: "queueName"
}

describe("deconstructServers()", () => {
  it("should extract 1 server when there is only 1 failover URL", () => {
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

  it("should extract 2 servers when there are 2 failover URLs", () => {
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
