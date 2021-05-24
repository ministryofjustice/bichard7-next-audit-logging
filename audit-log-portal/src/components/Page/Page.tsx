import { ReactNode } from "react"
import styled from "styled-components"

interface Props {
  children: ReactNode
}

const Main = styled.main`
  margin: 1rem;
`

const Page = ({ children }: Props) => <Main>{children}</Main>

export default Page
