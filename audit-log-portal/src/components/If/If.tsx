interface Props {
  condition: boolean
  children: React.ReactNode
}
const IF = ({ condition, children }: Props) => {
  if (!condition) {
    return null
  }

  return <>{children}</>
}

export default IF
