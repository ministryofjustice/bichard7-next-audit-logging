// See: https://stackoverflow.com/a/61155795/308012
export default (base64Encoded: string): string => Buffer.from(base64Encoded, "base64").toString("binary")
