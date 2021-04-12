const { setupWorker } = require("msw");
const { handlers } = require("./handlers");

const worker = setupWorker(...handlers);
