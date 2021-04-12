const { setupWorker } = require("msw");
const { handlers } = require("./handlers");

module.exports = { worker = setupWorker(...handlers) };
