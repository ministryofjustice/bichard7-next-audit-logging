import type * as S3 from "aws-sdk/clients/s3"
import AwsS3Gateway from "./AwsS3Gateway"

export default class TestAwsS3Gateway extends AwsS3Gateway {
  async bucketExists(bucketName: string): Promise<boolean> {
    const buckets = await this.client.listBuckets().promise()
    return !!buckets.Buckets?.find((bucket) => bucket.Name === bucketName)
  }

  async createBucket(skipIfExists = true): Promise<S3.CreateBucketOutput | undefined> {
    if (skipIfExists && (await this.bucketExists(this.getBucketName()))) {
      return undefined
    }

    return this.client
      .createBucket({
        Bucket: this.getBucketName()
      })
      .promise()
  }

  getBucketName(): string {
    if (!this.bucketName) {
      throw new Error("Bucket name does not have value.")
    }

    return this.bucketName
  }

  forBucket(bucketName: string): AwsS3Gateway {
    this.bucketName = bucketName
    return this
  }

  async getAll(): Promise<S3.ObjectList | undefined> {
    const { Contents } = await this.client.listObjects({ Bucket: this.getBucketName() }).promise()
    return Contents
  }

  async deleteAll(attempts = 5): Promise<void> {
    const contents = await this.getAll()

    if (contents && contents.length > 0) {
      const obj = <S3.Types.ObjectIdentifierList>contents.map(({ Key }) => ({ Key }))
      const params: S3.Types.DeleteObjectsRequest = {
        Bucket: this.getBucketName(),
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
    const params: S3.Types.GetObjectRequest = { Bucket: this.getBucketName(), Key: key }
    const content = await this.client.getObject(params).promise()
    return String(content.Body)
  }
}
