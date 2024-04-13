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
  env: {
    PUBLIC_URL: process.env.PUBLIC_URL || ""
  },
  webpack: (config, {isServer}) => {
    if(!isServer) {
      config.plugins.push(new MonacoWebpackPlugin({
        languages: [],
      }))
    }

    return config
  },
  publicRuntimeConfig: {
    lastUpdated: new Date().toISOString()
  }
}

module.exports = nextConfig
