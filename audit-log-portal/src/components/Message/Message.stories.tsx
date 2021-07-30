import type { Meta } from "@storybook/react"
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

const onRetry = (): Promise<void> => {
  return Promise.resolve()
}

export const Processing = () => <Message message={createMessage(AuditLogStatus.processing)} onRetry={onRetry} />
export const Retrying = () => <Message message={createMessage(AuditLogStatus.retrying)} onRetry={onRetry} />
export const Completed = () => <Message message={createMessage(AuditLogStatus.completed)} onRetry={onRetry} />
export const Failed = () => <Message message={createMessage(AuditLogStatus.error)} onRetry={onRetry} />
