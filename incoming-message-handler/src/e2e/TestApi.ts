import type { AxiosError } from "axios"
import axios from "axios"
import { readFileSync } from "fs"
import type { AuditLog } from "shared-types"
import { Poller, PollOptions } from "shared"

export default class TestApi {
  private apiUrl: string

  private getApiUrl(): string {
    if (this.apiUrl) {
      return this.apiUrl
    }

    const environmentVariablesFilePath = `${process.cwd()}/scripts/env-vars.json`
    const environmentVariables = JSON.parse(readFileSync(environmentVariablesFilePath, "utf-8")).Variables
    this.apiUrl = environmentVariables.API_URL.replace("localstack_main", "localhost")

    return this.apiUrl
  }

  getMessages(): Promise<AuditLog[]> {
    return axios
      .get(`${this.getApiUrl()}/messages`, { headers: { "X-API-KEY": "dummydummydummydummy" } })
      .then((response) => response.data)
      .catch((error) => <AxiosError>error)
  }

  pollForGetMessages(): Promise<AuditLog[]> {
    const options = new PollOptions<AuditLog[]>(40000)
    options.delay = 300
    options.condition = (messages) => {
      if (!messages || messages.length === 0) {
        return false
      }

      const message = messages[0]
      if (!message.events || message.events.length === 0) {
        return false
      }

      return true
    }

    return new Poller(() => this.getMessages()).poll(options)
  }
}
