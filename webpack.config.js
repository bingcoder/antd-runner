const path = require("path");
/** @type {import('webpack').Configuration } */
const config = {
  entry: {
    index: "./src/index.ts",
    action: "./src/action",
    "antd.zh-cn.min": "./src/getAntdLocal.ts",
  },
  devtool: false,
  output: {
    path: path.resolve(__dirname, "dist/js"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".js", ".json", ".wasm", ".ts", ".tsx"],
  },
  externals: {
    react: "react",
    "react-dom": "react-dom",
    antd: "antd",
    "@ant-design/icons": "@ant-design/icons",
    moment: "moment",
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-react",
                {
                  runtime: "automatic",
                },
              ],
              [
                "@babel/preset-typescript",
                {
                  allExtensions: true,
                  isTSX: true,
                },
              ],
            ],
          },
        },
      },
    ],
  },
};
module.exports = config;
