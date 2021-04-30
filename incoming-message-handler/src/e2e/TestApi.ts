import axios, { AxiosError } from "axios"
import { readFileSync } from "fs"
import { AuditLog, Poller, PollOptions } from "shared"

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
      .get(`${this.getApiUrl()}/messages`)
      .then((response) => response.data.messages)
      .catch((error) => <AxiosError>error)
  }

  pollForGetMessages(): Promise<AuditLog[]> {
    const options = new PollOptions<AuditLog[]>(10000)
    options.delay = 300
    options.condition = (messages) => messages.length > 0

    return new Poller(() => this.getMessages()).poll(options)
  }
}
