import Image from "next/image"
import Head from "components/Head"
import Messages from "components/Messages"
import NavBar from "components/NavBar"
import Page from "components/Page"

const Index = ({ data }) => (
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

export async function getServerSideProps() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`)
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

export default Index
