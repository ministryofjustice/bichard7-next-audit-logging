import Image from "next/image"
import Link from "next/link"
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

      <Link href="/test">
        Show Test Page
      </Link>
    </Page>
  </>
)

export default Index
