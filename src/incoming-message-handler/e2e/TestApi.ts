import type { AxiosError } from "axios"
import axios from "axios"
import { Poller, PollOptions } from "src/shared"
import type { AuditLog } from "src/shared/types"

export default class TestApi {
  private apiUrl = "http://localhost:3010"

  getMessages(): Promise<AuditLog[]> {
    return axios
      .get(`${this.apiUrl}/messages?includeColumns=createdBy`, { headers: { "X-API-KEY": "dummydummydummydummy" } })
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
