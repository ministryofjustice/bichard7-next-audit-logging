import { S3 } from "aws-sdk"
import { CreateBucketOutput, ObjectIdentifierList } from "aws-sdk/clients/s3"
import { getTimeFormatted } from "../../src/utils/date"

class S3Service {
  private s3: S3

  constructor(private config: S3.Types.ClientConfiguration, private bucketName: string) {
    this.s3 = new S3(config)
  }

  async init() {
    const hasBucket = await this.hasBucket()
    if (!hasBucket) {
      await this.createBucket()
    }
  }

  async hasBucket(): Promise<boolean | undefined> {
    const buckets = await this.s3.listBuckets().promise()
    return (
      buckets.Buckets &&
      buckets.Buckets.filter((b) => b.Name!.toLocaleLowerCase() === this.bucketName.toLocaleLowerCase()).length > 0
    )
  }

  async createBucket(): Promise<CreateBucketOutput | void> {
    const params = {
      Bucket: this.bucketName.toLocaleLowerCase(),
      CreateBucketConfiguration: {
        LocationConstraint: this.config.region
      }
    }
    const result = await this.s3.createBucket(params).promise()
    const { data, error } = result.$response
    if (error) throw error
    return data
  }

  async deleteBucket(): Promise<CreateBucketOutput | void> {
    const { Contents } = await this.s3.listObjects({ Bucket: this.bucketName }).promise()
    if (Contents && Contents.length > 0) {
      const obj: ObjectIdentifierList = Contents.map(({ Key }) => ({ Key: Key! }))
      const params: S3.Types.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: obj
        }
      }
      await this.s3.deleteObjects(params).promise()
    }
    const result = await this.s3.deleteBucket({ Bucket: this.bucketName }).promise()
    const { data, error } = result.$response
    if (error) throw error
    return data
  }

  async upload(id: string, content: string): Promise<string> {
    const params: S3.Types.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: `case-${id}-${getTimeFormatted()}.txt`,
      Body: content,
      ContentType: "text/html"
    }
    const result = await this.s3.upload(params).promise()
    return result.Location
  }
}

export default S3Service
