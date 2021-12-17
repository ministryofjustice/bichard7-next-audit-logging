export default (dateString: string): boolean => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  return date.toISOString() === dateString
}
