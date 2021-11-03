import fs from "fs"
import axios from "axios"
import { HttpStatusCode } from "shared"

const environmentVariables = JSON.parse(fs.readFileSync(`./scripts/env-vars.json`).toString())
const apiUrl = String(environmentVariables.Variables.API_URL).replace("localstack_main", "localhost")

it("should return forbidden response code when API key is not present", async () => {
  const response = await axios.get(`${apiUrl}/messages/MESSAGE_ID/events`).catch((error) => error)

  expect(response.response).toBeDefined()

  const { response: actualResponse } = response
  expect(actualResponse.status).toBe(HttpStatusCode.forbidden)
})

it("should return forbidden response code when API key is invalid", async () => {
  const response = await axios
    .get(`${apiUrl}/messages/MESSAGE_ID/events`, { headers: { "X-API-KEY": "Invalid API key" } })
    .catch((error) => error)

  expect(response.response).toBeDefined()

  const { response: actualResponse } = response
  expect(actualResponse.status).toBe(HttpStatusCode.forbidden)
})
