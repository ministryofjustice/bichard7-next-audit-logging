{
  "Comment": "Manages the workflow for processing events from the Bichard system",
  "StartAt": "Store Event",
  "States": {
    "Store Event": {
      "Type": "Task",
      "Resource": "${STORE_EVENT_LAMBDA_ARN}",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 180,
        "MaxAttempts": 99999999,
        "BackoffRate": 1.1
      }],
      "Next": "Delete from S3"
    },
    "Delete from S3": {
      "Type": "Task",
      "End": true,
      "Parameters": {
        "Bucket.$": "$.bucketName",
        "Key.$": "$.s3Path"
      },
      "Resource": "arn:aws:states:::aws-sdk:s3:deleteObject",
      "Retry": [{
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 180,
        "MaxAttempts": 99999999,
        "BackoffRate": 1.1
      }]
    }
  }
}
