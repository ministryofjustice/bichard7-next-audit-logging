import { z } from 'zod';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { gunzip } from 'zlib';
import { promisify } from 'util';

const ValidLogEvent = z.object({
    id: z.string(),
    timestamp: z.number(),
    message: z.string()
})

const ValidEvent = z.object({
    messageType: z.string(),
    owner: z.string(),
    logGroup: z.string(),
    logStream: z.string(),
    subscriptionFilters: z.string().array(), // string[]
    logEvents: z.array(ValidLogEvent)
})

const ValidInput = z.object({
    awslogs: z.object({
        data: z.string()
    })
})

interface Event {
    messageType: string;
    owner: string;
    logGroup: string;
    logStream: string;
    subscriptionFilters: string[];
    logEvents: LogEvent[];
}

interface LogEvent {
    id: string;
    timestamp: number;
    message: string;
}
// Timestamp 2022-01-13T14:03:26.627Z
// message: 020a9778-6292-415c-93f6-fec371521309	INFO	Event Data:
// {
//     "messageType": "DATA_MESSAGE",
//     "owner": "581823340673",
//     "logGroup": "cjse-bichard7-e2e-test-base-infra-user-service",
//     "logStream": "ecs-execute-command-00536d637959159da",
//     "subscriptionFilters": [
//         "temp-test-logs-to-lambda-filter-to-bucket"
//     ],
//     "logEvents": [
//         {
//             "id": "36619665797611662421829140266800454506155612148272922624",
//             "timestamp": 1642082606281,
//             "message": "2"
//         }
//     ]
// }
//
const generateObjectPath = (data: Event): string => {
    const date = new Date();
    const formatedDate = date.toLocaleDateString('en-GB').split('/').reverse().join(''); // '20211124'

    return `${data.logGroup}/${formatedDate}/${data.logStream}/${data.logEvents[0].timestamp}`
}

const uploadDataToS3 = async (data: Event, bucket: string, region: string): Promise<void> => {
    const client = new S3Client({ region });
    const command = new PutObjectCommand({
        Body: JSON.stringify(data),
        Bucket: bucket,
        Key: generateObjectPath(data)
    });
    await client.send(command);
    return
}

export const handler = async (input: unknown): Promise<void> => {
    try {
        const parsedInput = ValidInput.safeParse(input)
        if (!parsedInput.success) {
            throw parsedInput.error
        } else {
        // The Data attribute in the Lambda record is base64 encoded and compressed with the gzip format. The actual payload that Lambda receives is in the following format { "awslogs": {"data": "BASE64ENCODED_GZIP_COMPRESSED_DATA"} }
        const payload = Buffer.from(parsedInput.data.awslogs.data, 'base64');

        // annoyingly gunzip uses callbacks so do this to use async/ await
        const promisifiedGunzip = promisify(gunzip)

        // decompress a chunk of data
        const result = await promisifiedGunzip(payload)

        const parsedResult: Event = ValidEvent.parse(JSON.parse(result.toString('ascii'))); // zod will throw an error if it doesn't match our data type

        // write to s3 here
        return uploadDataToS3(parsedResult, process.env.ARCHIVE_USER_LOGS_BUCKET as string, process.env.REGION as string)
    }} catch (err) {
        throw err
    }
};
