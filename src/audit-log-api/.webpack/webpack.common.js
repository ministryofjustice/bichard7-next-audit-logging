const path = require("path")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
const webpack = require('webpack');

module.exports = {
  entry: {
    getMessages: "./src/handlers/getMessages.ts",
    createAuditLog: "./src/handlers/createAuditLog.ts",
    createAuditLogEvent: "./src/handlers/createAuditLogEvent.ts",
    getEvents: "./src/handlers/getEvents.ts",
    retryMessage: "./src/handlers/retryMessage.ts",
    sanitiseMessage: "./src/handlers/sanitiseMessage.ts"
  },
  resolve: {
    modules: [path.resolve("./node_modules"), path.resolve("."), path.resolve("../shared/node_modules")],
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
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    new ForkTsCheckerWebpackPlugin()
  ]
}
