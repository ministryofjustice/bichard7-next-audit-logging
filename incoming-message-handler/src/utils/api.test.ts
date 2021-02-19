jest.mock("axios")

import axios from "axios"
import { post } from "./Api"

describe("api", () => {
  describe("post", () => {
    it("make a successsful post call", async () => {
      const expectedResponse = {
        status: 200,
        statusMessage: "Success!"
      }
      const axiosSpy = jest.spyOn(axios, "post").mockResolvedValue(expectedResponse)

      await post("url", "message")

      expect(axiosSpy).toHaveBeenCalled()
    })

    it("make a w call and error", async () => {
      const expectedResponse = {
        status: 500,
        statusMessage: "Failed!"
      }
      const axiosSpy = jest.spyOn(axios, "post").mockRejectedValue(expectedResponse)

      const actual = await post("url", "message")
      expect(axiosSpy).toHaveBeenCalled()
      expect(actual).toEqual(expectedResponse)
    })
  })
})
