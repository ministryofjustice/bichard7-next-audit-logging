import S3, { ObjectIdentifierList } from "aws-sdk/clients/s3"
import S3Gateway from "./S3Gateway"

export default class TestS3Gateway extends S3Gateway {
  async getAll(): Promise<S3.ObjectList> {
    const { Contents } = await this.client.listObjects({ Bucket: this.bucketName }).promise()
    return Contents
  }

  async deleteAll(): Promise<void> {
    const contents = await this.getAll()

    if (contents && contents.length > 0) {
      const obj: ObjectIdentifierList = contents.map(({ Key }) => ({ Key }))
      const params: S3.Types.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: obj
        }
      }

      await this.client.deleteObjects(params).promise()
    }

    const remainingItems = await this.getAll()
    if (remainingItems.length > 0) {
      throw new Error(`Failed to delete all items! Remaining Items: ${remainingItems.length}`)
    }
  }
}
