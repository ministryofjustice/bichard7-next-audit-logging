export default (url) =>
  fetch(url).then(async (response) => {
    if (response.status !== 200) {
      const text = await response.text()
      throw new Error(text)
    }

    return response.json()
  })
