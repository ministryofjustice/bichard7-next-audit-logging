import Image from "next/image"
import Head from "components/Head"
import Messages from "components/Messages"
import NavBar from "components/NavBar"
import Page from "components/Page"

interface Props {
  data: {
    messages: []
  }
}

const Index = ({ data }: Props) => (
  <>
    <Head />
    <NavBar
      logo={<Image src="/logo.png" alt="Bichard7 Audit Log Portal" width="64" height="64" />}
      title="Bichard7 Audit Log Portal"
    />

    <Page>
      <Messages messages={data.messages || []} />
    </Page>
  </>
)

interface ApiResponse {
  notFound: boolean
  props?: Props
}

export async function getServerSideProps(): Promise<ApiResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`)
  const data = await response.json()

  if (!data) {
    return {
      notFound: true
    }
  }

  return {
    notFound: false,
    props: { data }
  }
}

export default Index
