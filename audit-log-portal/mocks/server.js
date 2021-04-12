const { setupServer } = require("msw/node");
const { handlers } = require("./handlers");

module.exports = { server: setupServer(...handlers) };
