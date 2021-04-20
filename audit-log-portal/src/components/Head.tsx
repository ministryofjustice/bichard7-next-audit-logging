import { memo } from "react"
import HtmlHead from "next/head"

const Head = () => (
  <HtmlHead>
    <title>Audit Log Portal</title>
    <link rel="icon" href="/favicon.ico" />
  </HtmlHead>
)

export default memo(Head)
