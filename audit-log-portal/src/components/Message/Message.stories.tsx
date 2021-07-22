import type { Meta } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { AuditLog, AuditLogStatus } from "shared"
import Message from "./Message"

export default {
  title: "components/Message",
  component: Message,
  argTypes: {
    onRetry: {
      action: "retry"
    }
  }
} as Meta

const createMessage = (status: string) => {
  const message = new AuditLog("LIBRA-EXISS-0001", new Date(), "XML")
  message.status = status

  return message
}

export const Processing = () => <Message message={createMessage(AuditLogStatus.processing)} onRetry={action("retry")} />
export const Retrying = () => <Message message={createMessage(AuditLogStatus.retrying)} onRetry={action("retry")} />
export const Completed = () => <Message message={createMessage(AuditLogStatus.completed)} onRetry={action("retry")} />
export const Failed = () => <Message message={createMessage(AuditLogStatus.error)} onRetry={action("retry")} />
