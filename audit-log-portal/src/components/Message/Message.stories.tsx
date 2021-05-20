import { Meta } from "@storybook/react"
import { AuditLog } from "shared"
import Message from "./Message"

export default {
  title: "components/Message",
  component: Message
} as Meta

const message = new AuditLog("LIBRA-EXISS-0001", new Date(), "XML")
export const Default = () => <Message message={message} />
