export default function convertObjectToURLSearchParams<T>(value: T): URLSearchParams {
  const params = new URLSearchParams()

  Object.keys(value).map((key) => params.append(key, value[key]))

  return params
}
