import { useEffect } from "react"
import type { GetServerSideProps } from "next"
import { AuditLog } from "shared"
import Header from "components/Header"
import Layout from "components/Layout"
import Messages from "components/Messages"
import MessageSearch from "components/MessageSearch"
import config from "config"

interface Props {
  data: AuditLog[]
}

const Index = ({ data }: Props) => {
  const search = () => console.log("Search!")

  useEffect(() => {
    search()
  }, [])

  return (
    <Layout pageTitle="Messages">
      <Header text="Messages" />
      <MessageSearch onSearch={(_) => search()} />
      <Messages messages={data || []} />
    </Layout>
  )
}

export default Index

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const response = await fetch(`${config.apiUrl}/messages`)
  const data = await response.json()

  if (!data) {
    return {
      notFound: true
    }
  }

  return {
    props: { data }
  }
}
