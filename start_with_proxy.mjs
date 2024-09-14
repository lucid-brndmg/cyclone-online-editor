/*
* This entry is only for fixing ERR_INCOMPLETE_CHUNKED_ENCODING on the deployment server.
* Use this entry to start the Next.js server if disk space on server is full
* */

import { createServer } from 'http'
import { parse, fileURLToPath } from 'url'
import next from 'next'
import { dirname, join } from 'path';
import { promises } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url));
const prefixLength = "/_next/".length

const readChunk = path => {
  return promises.readFile(join(__dirname, ".next", path.slice(prefixLength)))
}
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    if (parsedUrl.path.startsWith("/_next/static/chunks/")) {
      // Normally Next.js uses transfer-encoding: chunked on javascript chunks
      // which requires nginx (proxy server) to write external disk space

      // if the disk space is full,
      // ERR_INCOMPLETE_CHUNKED_ENCODING will occur because no space is left to write chunk files
      // hence the solution is to proxy these chunk requests,
      // force reading the file
      // then returning to user in one response (with content-length and without chunked)

      const content = await readChunk(req.url)
      res.setHeader('transfer-encoding', '')
      res.setHeader('Content-Length', content.length);
      res.writeHead(200)
      res.write(content)
      res.end()
    } else {
      await handle(req, res, parsedUrl)
    }
  }).listen(port)

  console.log(
    `> Server listening at http://localhost:${port}`
  )
})