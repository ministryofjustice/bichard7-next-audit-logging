import { rest } from "msw"
import messages from "./data/messages"

export const handlers = [
  rest.get("https://audit-log-api.dev/messages", (req, res, ctx) => {
    return res(ctx.json({ messages: messages }));
  })
];
