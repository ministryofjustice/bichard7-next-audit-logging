import S3rver from 's3rver';
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const PORT = 4569;
const HOST = '0.0.0.0';
const S3_DIRECTORY = '/tmp/s3local'; // Using a nested folder inside /tmp to stay organized

const BUCKETS = [
  'auditLogEventsBucket',
  'externalIncomingBucket',
  'internalIncomingBucket',
  'conductorIncomingBucket'
];

// Ensure the root directory and the bucket directories exist
console.log('📦 Initializing local S3 buckets...');
if (!existsSync(S3_DIRECTORY)) {
  mkdirSync(S3_DIRECTORY, { recursive: true });
}

BUCKETS.forEach(bucket => {
  const bucketPath = join(S3_DIRECTORY, bucket);
  if (!existsSync(bucketPath)) {
    mkdirSync(bucketPath);
    console.log(`   ✅ Created bucket directory: ${bucket}`);
  } else {
    console.log(`   ℹ️ Bucket directory already exists: ${bucket}`);
  }
});

// Configure and start S3rver
const instance = new S3rver({
  port: PORT,
  address: HOST,
  directory: S3_DIRECTORY,
  silent: false, // Set to true if you want to hide individual request logs
  configureBuckets: BUCKETS.map(name => ({ name }))
});

instance.run((err, host, port) => {
  if (err) {
    console.error('❌ Failed to start S3rver:', err);
    process.exit(1);
  }
  console.log(`🚀 S3rver successfully listening at http://${host}:${port}`);
});
