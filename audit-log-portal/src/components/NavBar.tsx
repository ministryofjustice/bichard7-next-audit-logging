import { ReactNode } from "react"
import styled from "styled-components"

interface Props {
  logo: JSX.Element
  title: string
  children?: ReactNode
}

const Nav = styled.nav`
  display: flex;
  flex-direction: row;
  padding: 0 0.5rem;
`

const NavBar = ({ logo, title, children }: Props) => (
  <Nav>
    {logo}

    <h1>{title}</h1>

    {children}
  </Nav>
)

export default NavBar
