import type MessageSearchModel from "types/MessageSearchModel"
import MessageSearchResults from "./MessageSearchResults"
import MessagesSearchResults from "./MessagesSearchResults"

export interface Props {
  searchModel: MessageSearchModel
}

const SearchResults = ({ searchModel }: Props) => {
  if (searchModel.messageId) {
    return <MessageSearchResults searchModel={searchModel} />
  } else {
    return <MessagesSearchResults searchModel={searchModel} />
  }
}

export default SearchResults
