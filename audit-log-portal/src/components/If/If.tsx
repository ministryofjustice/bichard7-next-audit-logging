import type { ReactNode } from "react"

interface Props {
  condition: boolean
  children: ReactNode
}
const If = ({ condition, children }: Props) => {
  if (!condition) {
    return null
  }

  return <>{children}</>
}

export default If
