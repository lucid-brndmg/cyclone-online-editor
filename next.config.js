const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const monacoRules = [
  {
    test: /\.ttf$/,
    type: 'asset/resource'
  }
]
/** @type {import('next').NextConfig} */

const baseUrl = process.env.PUBLIC_URL || ''

const nextConfig = {
  reactStrictMode: true,
  basePath: baseUrl,
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
