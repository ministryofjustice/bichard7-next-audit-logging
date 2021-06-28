export default (value: string): string => Buffer.from(value, "binary").toString("base64")
