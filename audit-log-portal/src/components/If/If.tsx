import { ReactNode } from "react"

interface Props {
  condition: boolean
  children: ReactNode
}
const IF = ({ condition, children }: Props) => {
  if (!condition) {
    return null
  }

  return <>{children}</>
}

export default IF
