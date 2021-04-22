const localStackUrl = process.env.LOCALSTACK_URL || "http://localhost:4566"
const localStackInternalUrl = process.env.LOCALSTACK_INTERNAL_URL || "http://localstack_main:4566"
const region = "us-east-1"

export { localStackUrl, localStackInternalUrl, region }
