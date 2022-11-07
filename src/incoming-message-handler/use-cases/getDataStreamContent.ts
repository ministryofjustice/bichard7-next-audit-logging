export default (xml: string) =>
  xml
    .match(/<(?:[\S]*:)?DataStreamContent(?:\s+[^>]*>|\s*>)(?<innerMessage>[\s\S]*)<\/(?:[\S]*:)?DataStreamContent>/)
    ?.groups?.innerMessage?.trim()
