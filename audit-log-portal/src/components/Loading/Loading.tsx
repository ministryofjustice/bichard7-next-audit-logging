import { Backdrop, CircularProgress } from "@material-ui/core"

interface Props {
  isLoading: boolean
}

const Loading = ({ isLoading }: Props) => (
  <Backdrop open={isLoading} style={{ zIndex: 9999 }}>
    <CircularProgress color="primary" />
  </Backdrop>
)

export default Loading
