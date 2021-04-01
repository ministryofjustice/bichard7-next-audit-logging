import Image from "next/image"
import Head from "components/Head"
import Messages from "components/Messages"
import NavBar from "components/NavBar"
import Page from "components/Page"

const Index = () => (
  <>
    <Head />
    <NavBar
      logo={(
        <Image
          src="/logo.png"
          alt="Bichard7 Audit Log Portal"
          width="64"
          height="64"
        />
      )}
      title="Bichard7 Audit Log Portal"
    />

    <Page>
      <Messages />
    </Page>
  </>
)

export default Index
