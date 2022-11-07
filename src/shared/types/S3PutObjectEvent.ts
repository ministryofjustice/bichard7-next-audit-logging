export default interface S3PutObjectEvent {
  id: string
  detail: {
    requestParameters: {
      bucketName: string
      key: string
    }
  }
}
