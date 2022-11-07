export default (fetchLargeObjectsParam: string | undefined) =>
  fetchLargeObjectsParam ? fetchLargeObjectsParam === "true" : true
