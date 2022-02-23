import { useState } from "react"

import Header from "components/Header"
import Layout from "components/Layout"
import Loading from "components/Loading"
import Messages from "components/Messages"
import MessageSearch from "components/MessageSearch"
import type MessageSearchModel from "types/MessageSearchModel"
import InfiniteScroll from "react-infinite-scroll-component"
import useGetMessages from "utils/useGetMessages"
import If from "components/If"
import SearchResults from "components/MessageSearchResults"

const Index = () => {
  const [searchModel, setSearchModel] = useState<MessageSearchModel>({})

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(model) => setSearchModel(model)} />
      <SearchResults searchModel={searchModel} />
    </Layout>
  )
}

export default Index
