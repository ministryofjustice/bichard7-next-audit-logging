import { S3 } from "aws-sdk"
import type { PromiseResult } from "../types"
import type S3Config from "./S3Config"

export default class S3Gateway {
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
