import { useState } from "react"
import useSWR from "swr"
import Error from "components/Error"
import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import Messages from "components/Messages"
import MessageSearch from "components/MessageSearch"
import MessageSearchModel from "types/MessageSearchModel"
import convertObjectToURLSearchParams from "utils/convertObjectToURLSearchParams"
import combineUrlAndQueryString from "utils/combineUrlAndQueryString"
import fetcher from "utils/fetcher"

const resolveApiUrl = (searchModel: MessageSearchModel): string => {
  const params = convertObjectToURLSearchParams(searchModel)
  return combineUrlAndQueryString(`/api/messages`, params.toString())
}

const Index = () => {
  const [searchModel, setSearchModel] = useState<MessageSearchModel>({})

  const { data, error } = useSWR(() => resolveApiUrl(searchModel), fetcher)

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(model) => setSearchModel(model)} disabled={!data} />

      {!!error && <Error message={error.message} />}
      {!!data && <Messages messages={data.messages || []} />}

      <Loading isLoading={!data} />
    </Layout>
  )
}

export default Index
