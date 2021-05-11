import { APIGateway } from "aws-sdk"

// Note: This function should only be used for testing purposes.
const getRestApisAsync = (gateway: APIGateway): Promise<APIGateway.RestApis> =>
  new Promise<APIGateway.RestApis>((resolve, reject) => {
    gateway.getRestApis((error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })

export default async (endpointUrl: string, region: string): Promise<string> => {
  const gateway = new APIGateway({
    endpoint: endpointUrl,
    region
  })

  const result = await getRestApisAsync(gateway)

  // Find the matching API
  const matchingApi = result.items?.find((api) => api.name === "AuditLogApi")
  if (!matchingApi) {
    throw new Error("Failed to find the Audit Log API. Make sure it is running locally")
  }

  return `${endpointUrl}/restapis/${matchingApi.id}/dev/_user_request_`
}
