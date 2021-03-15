export default interface S3PutObjectEvent {
  detail: {
    requestParameters: {
      bucketName: string
      key: string
    }
  }
}
