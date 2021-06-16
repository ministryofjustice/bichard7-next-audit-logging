import { useState } from "react"
import useSwr from "swr"
import Error from "components/Error"
import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import Messages from "components/Messages"
import MessageSearch from "components/MessageSearch"
import MessageSearchModel from "types/MessageSearchModel"

const fetcher = (url) => fetch(url).then((response) => response.json())

const resolveApiUrl = (searchModel: MessageSearchModel): string => {
  const params = new URLSearchParams()

  Object.keys(searchModel).map((key) => params.append(key, searchModel[key]))

  const baseUrl = `/api/messages`
  const queryString = params.toString()

  if (queryString.length > 0) {
    return `${baseUrl}?${queryString}`
  }

  return baseUrl
}

const Index = () => {
  const [searchModel, setSearchModel] = useState<MessageSearchModel>({})

  const { data, error } = useSwr(() => resolveApiUrl(searchModel), fetcher)

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
