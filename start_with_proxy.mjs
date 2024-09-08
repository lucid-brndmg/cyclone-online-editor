import { createServer } from 'http'
import { parse, fileURLToPath } from 'url'
import next from 'next'
import { dirname, join } from 'path';
import { promises } from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url));
const prefixLength = "/_next/".length

const read = path => {
  return promises.readFile(join(__dirname, ".next", path.slice(prefixLength)))
}
const port = 3000 // parseInt(process.env.PORT || '3001', 10)
const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    if (parsedUrl.path.startsWith("/_next/static/chunks/")) {
      const content = await read(req.url)
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