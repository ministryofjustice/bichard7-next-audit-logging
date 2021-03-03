import { S3 } from "aws-sdk"
import S3Service from "./services/S3Service"
import { getDateAndMonthFormatted } from "../src/utils/date"

const LOCALSTACK_URL = "http://localhost:4566"
const BUCKET_NAME = `incoming-message-log-${getDateAndMonthFormatted()}`

describe("s3 integration tests", () => {
  let s3Service: S3Service
  beforeAll(async () => {
    const config: S3.Types.ClientConfiguration = {
      region: "eu-west2",
      endpoint: LOCALSTACK_URL,
      s3ForcePathStyle: true
    }
    s3Service = new S3Service(config, BUCKET_NAME)
    await s3Service.init()
  })

  it("should upload a file to S3 bucket", async () => {
    const id = String(Date.now())
    const content = "Text to save"
    const actual = await s3Service.upload(id, content)
    expect(actual).toContain(LOCALSTACK_URL)
    expect(actual).toContain(BUCKET_NAME)
  })
})
