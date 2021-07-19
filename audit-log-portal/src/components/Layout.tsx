import type { ReactNode } from "react"
import Image from "next/image"
import styled from "styled-components"
import Head from "components/Head"
import NavBar from "components/NavBar"
import Main from "components/Main"

interface Props {
  pageTitle: string
  children: ReactNode
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`

const Content = styled.div`
  max-width: 1200px;
  width: 100%;
`

const Layout = ({ pageTitle, children }: Props) => (
  <>
    <Head />
    <Page>
      <Content>
        <NavBar
          logo={<Image src="/logo.png" alt="Bichard7 Audit Log Portal" width="64" height="64" />}
          title={`Bichard7 Audit Log Portal - ${pageTitle}`}
        />

        <Main>{children}</Main>
      </Content>
    </Page>
  </>
)

export default Layout
