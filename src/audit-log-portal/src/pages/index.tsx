import { useState } from "react"

import Header from "components/Header"
import Layout from "components/Layout"
import MessageSearch from "components/MessageSearch"
import type MessageSearchModel from "types/MessageSearchModel"
import SearchResults from "components/SearchResults"

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
