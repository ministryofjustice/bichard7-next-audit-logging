import styled from "styled-components"
import { Backdrop, CircularProgress } from "@material-ui/core"

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
      {isLoading && (
        <Block>
          <CircularProgress color="primary" />
        </Block>
      )}
    </>
  )
}

export default Loading
