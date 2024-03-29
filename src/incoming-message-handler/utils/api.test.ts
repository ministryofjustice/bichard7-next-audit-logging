jest.mock("axios")

import axios from "axios"
import { post } from "./api"

describe("api", () => {
  describe("post", () => {
    it("make a successful post call", async () => {
      const expectedResponse = {
        status: 200,
        statusMessage: "Success!"
      }
      jest.spyOn(axios, "post").mockResolvedValue(expectedResponse)

      const response = await post("url", "message")

      expect(response).toBeUndefined()
    })

    it("make a call and error", async () => {
      const error = new Error("Call failed")
      jest.spyOn(axios, "post").mockRejectedValue(error)
      const response = await post("url", "message")
      expect(response).toBe(error)
    })
  })
})
