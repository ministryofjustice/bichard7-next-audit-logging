import StepFunctionConfig from "./StepFunctionConfig"

export default (): StepFunctionConfig => {
  const { AWS_URL, AWS_REGION, STEP_FUNCTION_ARN } = process.env

  if (!AWS_URL) {
    throw new Error("AWS_URL environment variable is not set")
  }

  if (!AWS_REGION) {
    throw new Error("AWS_REGION environment variable is not set")
  }

  if (!STEP_FUNCTION_ARN) {
    throw new Error("STEP_FUNCTION_ARN environment variable is not set")
  }

  return {
    awsUrl: AWS_URL,
    region: AWS_REGION,
    stateMachineArn: STEP_FUNCTION_ARN
  }
}
