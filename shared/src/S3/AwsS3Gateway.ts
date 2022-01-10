import { S3 } from "aws-sdk"
import type { PromiseResult } from "shared-types"
import parseGetObjectResponse from "./parseGetObjectResponse"
import type { S3Config } from "shared-types"
import type { S3GatewayInterface } from "shared-types"

export default class AwsS3Gateway implements S3GatewayInterface {
  private readonly s3: S3

  protected bucketName?: string

  constructor(config: S3Config) {
    const { url, region, bucketName } = config

    if (bucketName) {
      this.bucketName = bucketName
    }

    this.s3 = new S3({
      endpoint: url,
      region,
      s3ForcePathStyle: true
    })
  }

  protected get client(): S3 {
    return this.s3
  }

  getBucketName(): string {
    if (!this.bucketName) {
      throw new Error("Bucket name does not have value")
    }

    return this.bucketName
  }

  forBucket(bucketName: string): S3GatewayInterface {
    this.bucketName = bucketName
    return this
  }

  getItem(key: string): PromiseResult<string> {
    const params: S3.GetObjectRequest = {
      Bucket: this.getBucketName(),
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
      Bucket: this.getBucketName(),
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
      Bucket: this.getBucketName()
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
      Bucket: this.getBucketName(),
      Key: key
    }

    return this.client
      .deleteObject(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }
}
