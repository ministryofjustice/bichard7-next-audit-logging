export default function fetcher<TResult>(url): Promise<TResult> {
  return fetch(url).then<TResult>(async (response) => {
    if (response.status !== 200) {
      const text = await response.text()
      throw new Error(text)
    }

    return response.json()
  })
}
