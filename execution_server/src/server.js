import Koa from 'koa';
import koaRouter from '@koa/router';
import { bodyParser } from "@koa/bodyparser";
import config from "./config.js";
import { execCycloneProgram } from "./cyclone.js"

// THE ONLY CORS LIB THAT WORKS,
// DO NOT USE @koa/cors
import cors from './cors.js';
import {ResponseCode} from "./definitions.js";

const app = new Koa()
const router = koaRouter()

app.use(cors())

router.post("/run", async ctx => {
  console.log("new request from", ctx.ip)
  const program = ctx.request.body?.program?.trim()
  if (!program) {
    return {code: ResponseCode.SyntaxError}
  }

  try {
    ctx.body = await execCycloneProgram(program)
  } catch (error) {
    console.log("error executing program", error);
    ctx.body = {code: ResponseCode.InternalError}
  }
})

export const serve = () => {
  app.proxy = config.isProxy
  app.use(bodyParser())
  app.use(router.routes())
  app.listen(config.port, config.host)

  console.log(`listening at ${config.host}:${config.port}`);
}