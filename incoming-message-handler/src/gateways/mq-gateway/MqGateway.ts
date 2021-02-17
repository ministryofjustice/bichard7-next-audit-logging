import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as https from 'https';
import { MqConfig } from '../../types';

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

class MqGateway {
  URL: string;
  instance: AxiosInstance;

  constructor(env: MqConfig) {
    this.URL = `https://${env.MQ_USER}:${env.MQ_PASSWORD}@${env.MQ_HOST}:${env.MQ_PORT}/ibmmq/rest/v2/messaging/qmgr/${env.MQ_QUEUE_MANAGER}/queue/${env.MQ_QUEUE}/message`;
    this.instance = axiosInstance;
  }

  async execute(message: string): Promise<AxiosResponse> {
    console.log(`Posting to: ${this.URL}`);
    const response = this.instance.post(this.URL, message, {
      headers: {
        'ibm-mq-rest-csrf-token': 'blank',
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
    return response;
  }
}

export default MqGateway;
