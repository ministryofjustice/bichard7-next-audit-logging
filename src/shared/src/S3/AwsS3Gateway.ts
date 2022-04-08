import { S3, Endpoint } from "aws-sdk"
import { isError, PromiseResult } from "shared-types"
import parseGetObjectResponse from "./parseGetObjectResponse"
import type { S3Config } from "shared-types"
import type { S3GatewayInterface } from "shared-types"

export default class AwsS3Gateway implements S3GatewayInterface {
  private readonly s3: S3

  protected bucketName?: string

  constructor(config: S3Config) {
    const { url, region, bucketName, accessKeyId, secretAccessKey } = config

    if (bucketName) {
      this.bucketName = bucketName
    }

    this.s3 = new S3({
      ...(url ? { endpoint: new Endpoint(url) } : {}),
      region,
      s3ForcePathStyle: true,
      accessKeyId,
      secretAccessKey
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

  deleteItem(key: string, version?: string): PromiseResult<void> {
    const params: S3.Types.DeleteObjectRequest = {
      Bucket: this.getBucketName(),
      Key: key,
      ...(version ? { VersionId: version } : {})
    }

    return this.client
      .deleteObject(params)
      .promise()
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  async deleteVersionedItem(key: string): PromiseResult<void> {
    const params: S3.Types.ListObjectVersionsRequest = {
      Bucket: this.getBucketName(),
      Prefix: key
    }

    const objectVersions = await this.client.listObjectVersions(params)
    .promise()
    .catch((error) => <Error>error)

    if(isError(objectVersions)){
      return objectVersions
    }

    const versionIds = objectVersions.Versions?.map((version) => version.VersionId) ?? []

    for(const versionId of versionIds) {
      const result = await this.deleteItem(key, versionId)
      if(isError(result)) {
        return result
      }
    }
  }
}
