import { Meta } from "@storybook/react"
import Message from "./Message"

export default {
  title: "components/Message",
  component: Message
} as Meta

export const Default = () => (
  <Message
    message={{
      messageId: "LIBRA-EXISS-001",
      caseId: "Case Id",
      receivedDate: new Date()
    }}
  />
)
