import type MessageSearchModel from "types/MessageSearchModel"
import GetMessageByIdResults from "./GetMessageByIdResults"
import MessagesSearchResults from "./MessagesSearchResults"
import { validate as validateUuid } from "uuid"

export interface Props {
  searchModel: MessageSearchModel
}

const SearchResults = ({ searchModel }: Props) => {
  if (validateUuid(searchModel.searchId)) {
    return <GetMessageByIdResults searchModel={searchModel} />
  } else {
    return <MessagesSearchResults searchModel={searchModel} />
  }
}

export default SearchResults
