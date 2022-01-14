import styled from "styled-components"
import { Backdrop, CircularProgress } from "@material-ui/core"
import If from "components/If"

interface Props {
  isLoading: boolean
  blockScreen?: boolean
}

const Block = styled.div`
  text-align: center;
  width: 100%;
`

const Loading = ({ isLoading, blockScreen }: Props) => {
  if (blockScreen) {
    return (
      <Backdrop open={isLoading} style={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>
    )
  }

  return (
    <>
      <If condition={isLoading}>
        <Block>
          <CircularProgress color="primary" />
        </Block>
      </If>
    </>
  )
}

export default Loading
