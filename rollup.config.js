const { nodeResolve } = require("@rollup/plugin-node-resolve");

/**@type {import('rollup').RollupOptions} */
module.exports = {
  input: {
    "antd.local": "src/getLocal.js",
  },
  output: {
    dir: "dist/js",
    format: "iife",
  },
  plugins: [nodeResolve()],
};
