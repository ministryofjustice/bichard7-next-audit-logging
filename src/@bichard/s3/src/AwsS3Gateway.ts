import { S3 } from "aws-sdk"
import type { PromiseResult } from "shared"
import parseGetObjectResponse from "./parseGetObjectResponse"
import type S3Config from "./S3Config"
import type S3Gateway from "./S3Gateway"

export default class AwsS3Gateway implements S3Gateway {
  private readonly s3: S3

  protected readonly bucketName: string

  constructor(config: S3Config) {
    const { url, region, bucketName } = config

    if (!bucketName) {
      throw Error("bucketName must have value.")
    }

    this.bucketName = bucketName

    this.s3 = new S3({
      endpoint: url,
      region,
      s3ForcePathStyle: true
    })
  }

  protected get client(): S3 {
    return this.s3
  }

  getItem(key: string): PromiseResult<string> {
    const params: S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: key
    }

    return this.s3
      .getObject(params)
      .promise()
      .then((response) => parseGetObjectResponse(response, key))
      .catch((error) => <Error>error)
  }

  upload<T>(fileName: string, content: T): PromiseResult<void> {
    const params: S3.Types.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: content
    }

    return this.client
      .upload(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  list(): PromiseResult<S3.ObjectList> {
    const params: S3.Types.ListObjectsV2Request = {
      Bucket: this.bucketName
    }

    return this.client
      .listObjectsV2(params)
      .promise()
      .then((result) => result.Contents || [])
      .catch((error) => <Error>error)
  }

  copyItemTo(key: string, destinationBucketName: string): PromiseResult<void> {
    const params: S3.Types.CopyObjectRequest = {
      CopySource: `${this.bucketName}/${key}`,
      Bucket: destinationBucketName,
      Key: key
    }

    return this.client
      .copyObject(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  deleteItem(key: string): PromiseResult<void> {
    const params: S3.Types.DeleteObjectRequest = {
      Bucket: this.bucketName,
      Key: key
    }

    return this.client
      .deleteObject(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }
}
