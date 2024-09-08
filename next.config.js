const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
/** @type {import('next').NextConfig} */

const baseUrl = process.env.PUBLIC_URL || ''

const nextConfig = {
  reactStrictMode: true,
  compress: false,
  basePath: baseUrl,
  env: {
    PUBLIC_URL: process.env.PUBLIC_URL || ""
  },
  httpAgentOptions: {
    keepAlive: false,
  },
  // async headers() {
  //   return [
  //     {
  //       // A hack to force Next.js to cache static resources in /public/*
  //       source: '/:all*(^\\/(?:public|dynamic|vs)\\/(?:.*)\\.(?:cyclone|json|js|ttf|html|css)$)',
  //       locale: false,
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=3600, must-revalidate',
  //         }
  //       ],
  //     },
  //   ]
  // },
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
