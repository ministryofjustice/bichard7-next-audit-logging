import { action } from "@storybook/addon-actions"
import type { Meta } from "@storybook/react"
import { AuditLog, AuditLogStatus } from "shared-types"
import Message from "./Message"

export default {
  title: "components/Message",
  component: Message,
  argTypes: {
    reloadMessages: {
      action: "reload messages"
    }
  }
} as Meta

const createMessage = (status: string) => {
  const message = new AuditLog("LIBRA-EXISS-0001", new Date(), "XML")
  message.status = status

  return message
}

export const Processing = () => (
  <Message message={createMessage(AuditLogStatus.processing)} reloadMessages={action("reload messages")} />
)
export const Retrying = () => (
  <Message message={createMessage(AuditLogStatus.retrying)} reloadMessages={action("reload messages")} />
)
export const Completed = () => (
  <Message message={createMessage(AuditLogStatus.completed)} reloadMessages={action("reload messages")} />
)
export const Failed = () => (
  <Message message={createMessage(AuditLogStatus.error)} reloadMessages={action("reload messages")} />
)
