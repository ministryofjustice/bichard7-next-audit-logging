/* eslint-disable import/no-duplicates */
import type { CreateBucketOutput, ObjectIdentifierList } from "aws-sdk/clients/s3"
import type S3 from "aws-sdk/clients/s3"
import S3Gateway from "./S3Gateway"

export default class TestS3Gateway extends S3Gateway {
  async bucketExists(bucketName: string): Promise<boolean> {
    const buckets = await this.client.listBuckets().promise()
    return !!buckets.Buckets?.find((bucket) => bucket.Name === bucketName)
  }

  async createBucket(bucketName: string, skipIfExists = true): Promise<CreateBucketOutput | undefined> {
    if (skipIfExists && (await this.bucketExists(bucketName))) {
      return undefined
    }

    return this.client
      .createBucket({
        Bucket: bucketName
      })
      .promise()
  }

  async getAll(): Promise<S3.ObjectList | undefined> {
    const { Contents } = await this.client.listObjects({ Bucket: this.bucketName }).promise()
    return Contents
  }

  async deleteAll(attempts = 5): Promise<void> {
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (attempts > 0) {
        await this.deleteAll(attempts - 1)
      } else {
        throw new Error("Could not delete items from S3 bucket")
      }
    }
  }

  async getContent(key: string): Promise<string> {
    const params: S3.Types.GetObjectRequest = { Bucket: this.bucketName, Key: key }
    const content = await this.client.getObject(params).promise()
    return String(content.Body)
  }
}
