import { memo } from "react"

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="fill-current w-4 h-4 mr-2"
    viewBox="0 0 20 20"
    width="18"
    height="18"
  >
    <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
  </svg>
)

export default memo(DownloadIcon)
