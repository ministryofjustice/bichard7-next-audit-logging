import { MqConfig } from "../types"
import { createMqConfig } from "./config2"

const envMock: MqConfig = {
  MQ_HOST: "a-host",
  MQ_PORT: "1999",
  MQ_QUEUE_MANAGER: "QMGR",
  MQ_QUEUE: "my-fake-queue",
  MQ_USER: "a-user",
  MQ_PASSWORD: "a-password"
}

describe("config", () => {
  describe("MQConfig", () => {
    it("returns the mqconfig", () => {
      process.env = { ...process.env, ...envMock }
      expect(createMqConfig()).toEqual(envMock)
    })
  })
})
