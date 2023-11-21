const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const monacoRules = [
  {
    test: /\.ttf$/,
    type: 'asset/resource'
  }
]
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, {isServer}) => {
    if(!isServer) {
      config.plugins.push(new MonacoWebpackPlugin({
        languages: [],
      }))
    }

    return config
  },
}

module.exports = nextConfig
