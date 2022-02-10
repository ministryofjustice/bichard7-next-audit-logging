const path = require("path")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")

module.exports = {
  entry: {
    retrieveFromS3: "./src/handlers/retrieveFromS3.ts",
    formatMessage: "./src/handlers/formatMessage.ts",
    parseMessage: "./src/handlers/parseMessage.ts",
    logMessageReceipt: "./src/handlers/logMessageReceipt.ts",
    sendToBichard: "./src/handlers/sendToBichard.ts",
    recordSentToBichardEvent: "./src/handlers/recordSentToBichardEvent.ts",
    storeMessage: "./src/handlers/storeMessage.ts"
  },
  resolve: {
    modules: [path.resolve("./node_modules"), path.resolve("."), path.resolve("."), path.resolve("../shared/node_modules")],
    extensions: [".js", ".json", ".ts"]
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "..", "build"),
    filename: "[name].js"
  },
  externals: ['pino-pretty'],
  target: "node",
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    node: "14"
                  }
                }
              ],
              ["@babel/preset-typescript"]
            ]
          }
        }
      }
    ]
  },
  plugins: [new ForkTsCheckerWebpackPlugin()]
}
