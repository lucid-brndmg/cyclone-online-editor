const Koa = require("koa")
const koaRouter = require("@koa/router")
const { bodyParser } = require("@koa/bodyparser");
const config = require("./config");
const { execCycloneProgram } = require("./cyclone");
const app = new Koa()
const router = koaRouter()

// THE ONLY CORS LIB THAT WORKS,
// DO NOT USE @koa/cors
const cors = require('./cors');

app.use(cors())

router.post("/run", async ctx => {
  console.log("new request from", ctx.ip)
  const program = ctx.request.body?.program?.trim()
  if (!program) {
    return {success: false}
  }

  try {
    ctx.body = await execCycloneProgram(program)
  } catch (error) {
    console.log("error executing program", error);
    ctx.body = {success: false}
  }
})

const serve = () => {
  app.proxy = config.isProxy
  app.use(bodyParser())
  app.use(router.routes())
  app.listen(config.port, config.host)

  console.log(`listening at ${config.host}:${config.port}`);
}

module.exports = {
  serve
}