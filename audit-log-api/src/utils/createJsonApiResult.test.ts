import { HttpStatusCode } from "shared"
import createJsonApiResult from "./createJsonApiResult"

describe("createJsonApiResult", () => {
  it("should return 'body' when 'body' is string", () => {
    const result = createJsonApiResult({ statusCode: HttpStatusCode.ok, body: "Content" })

    expect(result.body).toBe("Content")
    expect(result.statusCode).toBe(HttpStatusCode.ok)
    expect(result.headers).toHaveProperty("content-type")
    expect(result.headers["content-type"]).toBe("application/json")
  })

  it("should return stringified 'body' when 'body' is JSON", () => {
    const result = createJsonApiResult({ statusCode: HttpStatusCode.ok, body: { Message: "Content" } })

    expect(result.body).toBe('{"Message":"Content"}')
    expect(result.statusCode).toBe(HttpStatusCode.ok)
    expect(result.headers).toHaveProperty("content-type")
    expect(result.headers["content-type"]).toBe("application/json")
  })
})
