import Koa from 'koa';
import koaRouter from '@koa/router';
import { bodyParser } from "@koa/bodyparser";
import config from "../config.json" assert { type: "json" };
import {checkProgram, execCycloneProgram} from "./cyclone.js"

// THE ONLY CORS LIB THAT WORKS,
// DO NOT USE @koa/cors
import cors from './cors.js';
import {RedisKey, ResponseCode} from "./definitions.js";
import logger from "./logger.js";
import crypto from "node:crypto";
import redis from "./redis.js";
import cycloneQueue from "./queue.js";
import fs from "node:fs";

const app = new Koa()
const router = koaRouter()

app.use(cors())

router.post("/exec", async ctx => {
  const id = crypto.randomBytes(config.cyclone.idLength).toString("hex")
  const logCtx = {path: "/run", ip: ctx.ip, id}
  logger.info("incoming request", logCtx)
  const program = ctx.request.body?.program?.trim()
  if (!program) {
    return {code: ResponseCode.InvalidParams}
  }

  const {invalidOptions, syntaxError} = checkProgram(program)

  if (syntaxError) {
    return {code: ResponseCode.SyntaxError}
  }

  if (invalidOptions) {
    return {code: ResponseCode.InvalidOptions, data: invalidOptions}
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

      ctx.body = {code, data}
    }
  } catch (error) {
    logger.error("error handling endpoint", {...logCtx, error})
    ctx.body = {code: ResponseCode.InternalError}
  }
})

router.get("/get", async ctx => {
  const logCtx = {path: "/get", ip: ctx.ip}
  logger.info("incoming request", logCtx)
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

export const serve = () => {
  app.proxy = config.server.isProxy
  app.use(bodyParser())
  app.use(router.routes())
  app.listen(config.server.port, config.server.host)

  logger.info(`server listening at ${config.server.host}:${config.server.port}`);
}