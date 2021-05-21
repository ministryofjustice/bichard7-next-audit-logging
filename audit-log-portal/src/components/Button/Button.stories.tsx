import DownloadIcon from "icons/DownloadIcon"
import Button from "./Button"

export default {
  title: "components/Button",
  component: Button
}

export const TextOnly = () => <Button>{`Click Me!`}</Button>

export const IconAndText = () => <Button icon={<DownloadIcon />}>{`Click Me!`}</Button>
