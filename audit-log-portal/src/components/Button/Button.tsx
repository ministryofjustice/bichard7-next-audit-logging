import { ReactNode } from "react"
import styled from "styled-components"

interface Props {
  icon?: ReactNode
  children: ReactNode
}

const StyledButton = styled.button`
  background-color: white;
  padding: 0.5rem;
  border-radius: 5px;
  border-width: 1px;
  border-color: ${(props) => props.theme.colors.muted};
  cursor: pointer;

  &:hover {
    background-color: rgb(235, 235, 255, 0.25);
  }

  &:active {
    background-color: rgb(235, 235, 255, 0.8);
  }
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
  <StyledButton>
    <ChildrenContainer>
      {icon}
      {children}
    </ChildrenContainer>
  </StyledButton>
)

export default Button
