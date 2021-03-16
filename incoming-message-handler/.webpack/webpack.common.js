const path = require("path")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")

module.exports = {
  entry: "./src/index.ts",
  resolve: {
    extensions: [".js", ".json", ".ts"]
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "..", "build"),
    filename: "index.js"
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            "presets": [
              [
                "@babel/preset-env",
                {
                  "targets": {
                    "node": "14"
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
