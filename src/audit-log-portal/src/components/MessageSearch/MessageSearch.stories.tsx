import { action } from "@storybook/addon-actions"
import MessageSearch from "./MessageSearch"

export default {
  title: "components/MessageSearch",
  component: MessageSearch,
  argTypes: {
    onSearch: {
      action: "search"
    }
  }
}

export const Empty = () => <MessageSearch onSearch={action("search")} />
