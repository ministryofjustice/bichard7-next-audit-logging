export default class MqConfig {
  constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly username: string,
    public readonly password: string,
    public readonly queueName: string
  ) {}
}
