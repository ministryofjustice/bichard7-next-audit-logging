import { isError } from "shared"
import { MqConfig } from "src/configs"
import MqGateway from "src/gateways/MqGateway"
import SendMessageUseCase from "./SendMessageUseCase"

const config = new MqConfig("host", 1234, "username", "password", "queueName")
const gateway = new MqGateway(config)
const useCase = new SendMessageUseCase(gateway)

describe("SendMessageUseCase", () => {
  describe("send()", () => {
    it("should return undefined when the message was sent successfully", async () => {
      jest.spyOn(gateway, "execute").mockResolvedValue(undefined)
      const result = await useCase.send("<?xml?><root/>")

      expect(isError(result)).toBe(false)
      expect(result).toBeUndefined()
    })

    it("should return an error when the message failed to send", async () => {
      const expectedError = new Error("Test error")
      jest.spyOn(gateway, "execute").mockResolvedValue(expectedError)

      const result = await useCase.send("<?xml?><root/>")

      expect(isError(result)).toBe(true)
      expect(<Error>result).toBe(expectedError)
    })
  })
})
