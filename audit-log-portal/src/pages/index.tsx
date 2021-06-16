import { useState } from "react"
import useSwr from "swr"
import Header from "components/Header"
import Layout from "components/Layout"
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

  if (error) {
    return <Layout pageTitle="Messages">{error.message}</Layout>
  }

  if (!data) {
    return (
      <Layout pageTitle="Messages">
        <i>{`Loading...`}</i>
      </Layout>
    )
  }

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(model) => setSearchModel(model)} />
      <Messages messages={data.messages || []} />
    </Layout>
  )
}

export default Index
