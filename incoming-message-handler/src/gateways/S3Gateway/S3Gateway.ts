import { S3 } from "aws-sdk"
import { PromiseResult } from "@handlers/common"
import { S3Config } from "../../configs"

export default class S3Gateway {
  private readonly s3: S3

  protected readonly bucketName: string

  constructor(config: S3Config) {
    const { S3_URL, S3_REGION, S3_FORCE_PATH_STYLE, INCOMING_MESSAGE_BUCKET_NAME } = config
    this.bucketName = INCOMING_MESSAGE_BUCKET_NAME
    this.s3 = new S3({
      endpoint: S3_URL,
      region: S3_REGION,
      s3ForcePathStyle: S3_FORCE_PATH_STYLE === "true"
    })
  }

  protected get client(): S3 {
    return this.s3
  }

  async getItem(bucketName: string, key: string): PromiseResult<string> {
    const params = {
      Bucket: bucketName,
      Key: key
    }

    return this.s3
      .getObject(params)
      .promise()
      .then((response) => response.Body.toString("utf-8"))
      .catch((error) => <Error>error)
  }

  async upload<T>(fileName: string, content: T): PromiseResult<void> {
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
