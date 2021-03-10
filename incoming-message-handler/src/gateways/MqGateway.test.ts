jest.mock("axios")

import axios from "axios"
import { MqConfig } from "../configs"
import MqGateway from "./MqGateway"

const env: MqConfig = {
  MQ_HOST: "a-host",
  MQ_PORT: "1999",
  MQ_QUEUE_MANAGER: "QMGR",
  MQ_QUEUE: "my-fake-queue",
  MQ_USER: "a-user",
  MQ_PASSWORD: "a-password"
}

describe("MqGateway", () => {
  let gateway: MqGateway

  beforeAll(() => {
    gateway = new MqGateway(env)
  })

  it("makes correct call to the MQ API and returns undefined on success", async () => {
    const expectedResponse = {
      status: 200,
      statusMessage: "Success!"
    }

    axios.post = jest.fn().mockResolvedValue(expectedResponse)

    const actual = await gateway.execute("test message")

    expect(actual).toBeUndefined()
  })

  it("makes an incorrect call to the MQ API and returns an error", async () => {
    const expectedError = new Error("test error")

    axios.post = jest.fn().mockRejectedValue(expectedError)

    const actual = await gateway.execute("failing message")

    expect(actual).toBe(expectedError)
  })
})
