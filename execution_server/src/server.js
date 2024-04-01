/*
* Server of KOA
* Main procedure of various APIs
*
* */

import Koa from 'koa';
import koaRouter from '@koa/router';
import { bodyParser } from "@koa/bodyparser";
import config from "./config.js"
import {checkProgram, execCycloneProgram, getCycloneVersion} from "./cyclone.js"

// THE ONLY CORS LIB THAT WORKS,
// DO NOT USE @koa/cors
import cors from './utils/cors.js';
import {RedisKey, ResponseCode} from "./definitions.js";
import {serviceLogger} from "./logger.js";
import crypto from "node:crypto";
import redis from "./redis.js";
import cycloneQueue from "./queue.js";

const app = new Koa()
const router = koaRouter()

app.use(cors())

// execute a source code as request
router.post("/exec", async ctx => {
  const id = crypto.randomBytes(config.cyclone.idLength).toString("hex")
  const logCtx = {path: "/exec", ip: ctx.ip, id}
  serviceLogger.info("incoming request", logCtx)
  const program = ctx.request.body?.program
  if (!program) {
    return ctx.body = {code: ResponseCode.InvalidParams}
  }

  // check for invalid options or syntax errors
  const {invalidOptions, syntaxError} = checkProgram(program)

  if (syntaxError) {
    return ctx.body =  {code: ResponseCode.SyntaxError}
  }

  if (invalidOptions) {
    return ctx.body = {code: ResponseCode.InvalidOptions, data: invalidOptions}
  }

  try {
    if (config.queue.enabled) {
      const job = cycloneQueue.createJob({
        program,
        id
      })

      await job.save()
      ctx.body = {code: ResponseCode.Enqueued, data: id}
    } else {
      const {code, data} = await execCycloneProgram(program, id)
      serviceLogger.debug("sync execution completed", {code, data, id})
      ctx.body = {code, data}
    }
  } catch (error) {
    serviceLogger.error("error handling endpoint", {...logCtx, error})
    ctx.body = {code: ResponseCode.InternalError}
  }
})

// polling for result, only works under queued mode
router.get("/get", async ctx => {
  const logCtx = {path: "/get", ip: ctx.ip}
  serviceLogger.info("incoming request", logCtx)
  if (!config.queue.enabled) {
    return ctx.body = {code: ResponseCode.NotSupported}
  }

  const id = ctx.query.id
  if (!id) {
    return ctx.body = {code: ResponseCode.InvalidParams}
  }

  const result = await redis.getDel(`${RedisKey.executionResult}:${id}`)
  if (!result) {
    return ctx.body = {code: ResponseCode.NotFound}
  }

  ctx.body = JSON.parse(result)
  // const {isSuccess, data} = JSON.parse(result)
  // if (!isSuccess) {
  //   return ctx.body = {code: ResponseCode.UnsuccessfulExecution}
  // }
  //
  // return ctx.body = {
  //   code: ResponseCode.Success,
  //   data
  // }
})

// get the current version of Cyclone
router.get("/version", async ctx => {
  const logCtx = {path: "/version", ip: ctx.ip}
  serviceLogger.info("incoming request", logCtx)
  ctx.body = {code: ResponseCode.Success, data: getCycloneVersion()}
})

export const serve = () => {
  app.proxy = config.server.isProxy
  if (app.proxy) {
    app.proxyIpHeader = config.server.proxyIpHeader
  }
  app.use(bodyParser())
  app.use(router.routes())
  app.listen(config.server.port, config.server.host)

  serviceLogger.info(`server listening at ${config.server.host}:${config.server.port} under ${config.queue.enabled ? "QUEUE" : "SYNCHRONOUS"} mode`);
}