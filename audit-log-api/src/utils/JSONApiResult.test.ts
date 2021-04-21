import { HttpStatusCode } from "shared"
import createJSONApiResult from "./JSONApiResult"

describe("createJsonApiResult", () => {
  it("should return 'body' when 'body' is string", () => {
    const result = createJSONApiResult({ statusCode: HttpStatusCode.Ok, body: "Content" })

    expect(result.body).toBe("Content")
    expect(result.statusCode).toBe(HttpStatusCode.Ok)
    expect(result.headers).toHaveProperty("content-type")
    expect(result.headers["content-type"]).toBe("application/json")
  })

  it("should return stringified 'body' when 'body' is JSON", () => {
    const result = createJSONApiResult({ statusCode: HttpStatusCode.Ok, body: { Message: "Content" } })

    expect(result.body).toBe('{"Message":"Content"}')
    expect(result.statusCode).toBe(HttpStatusCode.Ok)
    expect(result.headers).toHaveProperty("content-type")
    expect(result.headers["content-type"]).toBe("application/json")
  })
})
