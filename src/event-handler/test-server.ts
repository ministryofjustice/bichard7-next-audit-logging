/* eslint-disable import/no-extraneous-dependencies */
import type { Message } from "@stomp/stompjs"
import { Client } from "@stomp/stompjs"
import { AuditLogApiClient, encodeBase64 } from "src/shared"
import { isError } from "src/shared/types/Result"
import { WebSocket } from "ws"
import createApiConfig from "./lib/createApiConfig"
import createMqConfig from "./lib/createMqConfig"
import type { EventInput } from "./types"
import CreateEventUseCase from "./use-cases/CreateEventUseCase"
import translateEvent from "./use-cases/translateEvent"
Object.assign(global, { WebSocket })

const mqConfig = createMqConfig()
const { apiUrl, apiKey } = createApiConfig()
const sourceQueue = process.env.SOURCE_QUEUE ?? "GENERAL_EVENT_QUEUE"

const client = new Client({
  brokerURL: mqConfig.url,
  connectHeaders: {
    login: mqConfig.username,
    passcode: mqConfig.password
  }
})

const api = new AuditLogApiClient(apiUrl, apiKey, 5_000)
const createEventUseCase = new CreateEventUseCase(api)

console.log(`Connecting to ${mqConfig.url}`)
client.onConnect = () => {
  console.log("Connected")
  client.subscribe(sourceQueue, async (message: Message): Promise<void> => {
    console.log("Received message")

    const eventInput: EventInput = {
      s3Path: "",
      messageData: encodeBase64(message.body),
      messageFormat: "GeneralEvent",
      eventSourceArn: "",
      eventSourceQueueName: sourceQueue
    }
    const translateEventResult = await translateEvent(eventInput)

    if (isError(translateEventResult)) {
      console.error(translateEventResult)
      return
    }

    const { messageId, event: messageEvent } = translateEventResult
    console.log(`[${messageId}] - Logging event - ${messageEvent.eventType} (${messageEvent.eventCode})`)

    const createEventResult = await createEventUseCase.execute(messageId, messageEvent)

    if (isError(createEventResult)) {
      console.error(createEventResult)
      return
    }
  })
}

client.activate()
