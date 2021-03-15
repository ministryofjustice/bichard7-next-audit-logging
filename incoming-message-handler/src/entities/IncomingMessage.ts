export default class IncomingMessage {
  constructor(
    public readonly messageId: string,
    public readonly receivedDate: Date,
    public readonly messageXml: string
  ) {}
}
