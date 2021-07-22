import type { Meta } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { AuditLog } from "shared"
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

const message = new AuditLog("LIBRA-EXISS-0001", new Date(), "XML")
export const Default = () => <Message message={message} onRetry={action("retry")} />
