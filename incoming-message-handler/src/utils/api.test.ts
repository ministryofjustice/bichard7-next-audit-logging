jest.mock("axios")

import axios from "axios"
import { post } from "./api2"

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
      const expectedResponse = {
        status: 500,
        statusMessage: "Failed!"
      }
      jest.spyOn(axios, "post").mockRejectedValue(expectedResponse)
      try {
        await post("url", "message")
      } catch (e) {
        expect(e).toEqual(expectedResponse)
      }
    })
  })
})
