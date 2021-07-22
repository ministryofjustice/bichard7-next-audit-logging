/* eslint-disable import/no-duplicates */
import type { CreateBucketOutput, ObjectIdentifierList } from "aws-sdk/clients/s3"
import type S3 from "aws-sdk/clients/s3"
import AwsS3Gateway from "./AwsS3Gateway"

export default class TestAwsS3Gateway extends AwsS3Gateway {
  async bucketExists(bucketName: string): Promise<boolean> {
    const buckets = await this.client.listBuckets().promise()
    return !!buckets.Buckets?.find((bucket) => bucket.Name === bucketName)
  }

  async createBucket(skipIfExists = true): Promise<CreateBucketOutput | undefined> {
    if (skipIfExists && (await this.bucketExists(this.bucketName))) {
      return undefined
    }

    return this.client
      .createBucket({
        Bucket: this.bucketName
      })
      .promise()
  }

  async getAll(): Promise<S3.ObjectList | undefined> {
    const { Contents } = await this.client.listObjects({ Bucket: this.bucketName }).promise()
    return Contents
  }

  async deleteAll(): Promise<void> {
    const contents = await this.getAll()

    if (contents && contents.length > 0) {
      const obj = <ObjectIdentifierList>contents.map(({ Key }) => ({ Key }))
      const params: S3.Types.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: obj
        }
      }

      await this.client.deleteObjects(params).promise()
    }

    const remainingItems = await this.getAll()
    if (remainingItems && remainingItems.length > 0) {
      throw new Error(`Failed to delete all items! Remaining Items: ${remainingItems?.length}`)
    }
  }

  async getContent(key: string): Promise<string> {
    const params: S3.Types.GetObjectRequest = { Bucket: this.bucketName, Key: key }
    const content = await this.client.getObject(params).promise()
    return String(content.Body)
  }
}
