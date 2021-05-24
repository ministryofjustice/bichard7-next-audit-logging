import { ReactNode } from "react"
import styled from "styled-components"
import { Button as MuiButton } from "@material-ui/core"

interface Props {
  icon?: ReactNode
  children: ReactNode
}

const ChildrenContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-weight: normal;

  & > * {
    margin: 0 0.5rem;
  }
`

const Button = ({ icon, children }: Props) => (
  <MuiButton variant="outlined">
    <ChildrenContainer>
      {icon}
      {children}
    </ChildrenContainer>
  </MuiButton>
)

export default Button
