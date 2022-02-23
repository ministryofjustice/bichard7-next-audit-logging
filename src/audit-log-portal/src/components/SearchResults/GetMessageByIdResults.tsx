import If from "../If"
import Loading from "../Loading"
import { Fragment } from "react"
import Error from "components/Error"
import useGetMessage from "utils/useGetMessage"
import Message from "../Message"
import NoMessages from "../Messages/NoMessages"
import type { Props } from "./SearchResults"

const GetMessageByIdResults = ({ searchModel }: Props) => {
  const apiUrl = `/audit-logging/api/messages/${searchModel.searchId}`
  const { message, error, isLoading, reload } = useGetMessage(apiUrl)

  return (
    <Fragment>
      <Error message={error?.message} visibleIf={!!error} />

      <If condition={!!message && !error}>
        <Message message={message} reloadMessages={reload} />
      </If>

      <If condition={!message && !error}>
        <NoMessages />
      </If>

      <Loading isLoading={isLoading} blockScreen={isLoading} />
    </Fragment>
  )
}

export default GetMessageByIdResults
