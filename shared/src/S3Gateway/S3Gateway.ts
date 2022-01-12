import { S3, Endpoint } from "aws-sdk"
import type { PromiseResult, S3Config } from "shared-types"

export default class S3Gateway {
  private readonly s3: S3

  protected readonly bucketName: string

  constructor(config: S3Config) {
    const { url, region, bucketName, accessKeyId, secretAccessKey } = config

    if (!url) {
      throw Error("bucketName and url must have value.")
    }

    if (bucketName) {
      this.bucketName = bucketName
    }

    this.s3 = new S3({
      endpoint: new Endpoint(url),
      region,
      s3ForcePathStyle: true,
      accessKeyId,
      secretAccessKey
    })
  }

  protected get client(): S3 {
    return this.s3
  }

  getItem(bucketName: string, key: string): PromiseResult<string> {
    const params = {
      Bucket: bucketName,
      Key: key
    }

    return this.s3
      .getObject(params)
      .promise()
      .then((response) => response.Body?.toString("utf-8") ?? Error(`Content is empty for key ${key}.`))
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
}
