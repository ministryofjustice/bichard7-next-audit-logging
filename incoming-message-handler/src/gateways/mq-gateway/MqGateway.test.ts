const AxiosInstanceMock = {
  post: jest.fn((...args) => Promise.resolve(response)),
};

jest.mock('axios', () => {
  return {
    default: {
      create: jest.fn(() => AxiosInstanceMock),
    },
  };
});
import MqGateway from './MqGateway';

const env = {
  MQ_HOST: 'a-host',
  MQ_PORT: '1999',
  MQ_QUEUE_MANAGER: 'QMGR',
  MQ_QUEUE: 'my-fake-queue',
  MQ_USER: 'a-user',
  MQ_PASSWORD: 'a-password',
};

const URL = `https://${env.MQ_USER}:${env.MQ_PASSWORD}@${env.MQ_HOST}:${env.MQ_PORT}/ibmmq/rest/v2/messaging/qmgr/${env.MQ_QUEUE_MANAGER}/queue/${env.MQ_QUEUE}/message`;
const message = {
  messageId: '059f36b4-87a3-44ab-832-661975830a7d',
  receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...',
  body: 'Test message.',
  attributes: {
    ApproximateReceiveCount: '1',
    SentTimestamp: '1545082649183',
    SenderId: 'AIDAIENQZJOLO23YVJ4VO',
    ApproximateFirstReceiveTimestamp: '1545082649185',
  },
  messageAttributes: '{}',
  md5OfBody: 'e4e68fb7bd0e697a0ae8f1bb342846b3',
  eventSource: 'aws:sqs',
  eventSourceARN: 'arn:aws:sqs:us-east-2:123456789012:my-queue',
  awsRegion: 'us-east-2',
}.toString();
const headers = {
  headers: {
    'ibm-mq-rest-csrf-token': 'blank',
    'Content-Type': 'text/plain;charset=utf-8',
  },
};
const response = {
  status: 200,
  statusMessage: 'Success!',
};

describe.only('MqGateway', function () {
  it.only('makes correct call to the MQ API returns the response', async () => {
    const mqGateway = new MqGateway(env);
    const mQresponse = await mqGateway.execute(message);

    expect(AxiosInstanceMock.post).toBeCalledWith(
      URL,
      message,
      headers,
    );
    expect(mQresponse).toEqual(response);
  });
});
