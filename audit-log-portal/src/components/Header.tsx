import { Typography } from "@material-ui/core"

interface Props {
  text: string
}

const Header = ({ text }: Props) => (
  <Typography variant="h4" gutterBottom>
    {text}
  </Typography>
)

export default Header
