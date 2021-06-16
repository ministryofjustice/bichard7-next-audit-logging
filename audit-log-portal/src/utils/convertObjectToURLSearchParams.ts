export default (value: any): URLSearchParams => {
  const params = new URLSearchParams()

  Object.keys(value).map((key) => params.append(key, value[key]))

  return params
}
