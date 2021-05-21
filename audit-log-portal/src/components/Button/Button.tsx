import { ReactNode } from "react"
import styled from "styled-components"

interface Props {
  icon?: ReactNode
  children: ReactNode
}

const StyledButton = styled.button`
  padding: 0.5rem;
`

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
  <StyledButton className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center">
    <ChildrenContainer>
      {icon}
      {children}
    </ChildrenContainer>
  </StyledButton>
)

export default Button
