import { MqConfig } from '../types';

const response = {
  status: 200,
  statusMessage: 'Success!',
};

const AxiosInstanceMock = {
  post: jest.fn(() => Promise.resolve(response)),
};

jest.mock('axios', () => {
  return {
    create: jest.fn(() => AxiosInstanceMock),
  };
});

// Note: Need to import the gateway after we initialize AxiosInstanceMock
// as this import will import the axios module that we are trying to import.
import MqGateway from './MqGateway';

const env: MqConfig = {
  MQ_HOST: 'a-host',
  MQ_PORT: '1999',
  MQ_QUEUE_MANAGER: 'QMGR',
  MQ_QUEUE: 'my-fake-queue',
  MQ_USER: 'a-user',
  MQ_PASSWORD: 'a-password',
};

describe.only('MqGateway', () => {
  it.only('makes correct call to the MQ API returns the response', async () => {
    const gateway = new MqGateway(env);
    const response = await gateway.execute('test message');

    expect(AxiosInstanceMock.post).toBeCalledTimes(1);
    expect(response).toEqual(response);
  });
});
