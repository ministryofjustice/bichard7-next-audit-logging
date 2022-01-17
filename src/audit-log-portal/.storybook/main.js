const path = require("path")

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-actions"],
  webpackFinal: async (config) => {
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve("./src/")]

    return config
  }
}