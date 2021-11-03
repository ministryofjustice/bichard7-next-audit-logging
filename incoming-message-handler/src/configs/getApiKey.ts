export default (): string => {
  const { API_KEY } = process.env

  if (!API_KEY) {
    throw Error("API_KEY environment variable must have value.")
  }

  return API_KEY
}
