import type MessageSearchModel from "types/MessageSearchModel"
import GetMessageByIdResults from "./GetMessageByIdResults"
import MessagesSearchResults from "./MessagesSearchResults"

export interface Props {
  searchModel: MessageSearchModel
}

const SearchResults = ({ searchModel }: Props) => {
  const hexDigit = "\\da-fA-F"
  if (searchModel.searchId?.match(/[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12}/)) {
    return <GetMessageByIdResults searchModel={searchModel} />
  } else {
    return <MessagesSearchResults searchModel={searchModel} />
  }
}

export default SearchResults
