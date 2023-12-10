import {serviceLogger} from "./src/logger.js";
import config from "./config.json" assert { type: "json" };
import fs from "node:fs";
import {execCycloneProgram} from "./src/cyclone.js";
import redis from "./src/redis.js";
import {RedisKey} from "./src/definitions.js";
import queue from "./src/queue.js";
import {prepareDependencies} from "./src/dependencies.js";

let garbageFiles = []
const deleteAfterExec = config.cyclone.deleteAfterExec

if (config.queue.autoClearFileIntervalMs > 0 && !deleteAfterExec) {
  setInterval(async () => {
    const clearing = garbageFiles
    garbageFiles = []

    await Promise.all(clearing.map(p => fs.promises.rm(p, {force: true})))
    serviceLogger.info("auto cleared garbage files", {size: clearing.length})
  }, config.queue.autoClearFileIntervalMs)
}

const processor = async job => {
  const {program, id} = job.data
  if (!program || !id) {
    serviceLogger.warn("discarding corrupted job", {id})
    return
  }

  const {code, data, garbage} = await execCycloneProgram(program, id)
  if (garbage.length && !deleteAfterExec) {
    garbageFiles.push(...garbage)
  }

  await redis.set(`${RedisKey.executionResult}:${id}`, JSON.stringify({code, data}), {
    EX: config.queue.resultTTLSecs
  })

  serviceLogger.info("job processed", {id})
}

if (!config.queue.enabled) {
  serviceLogger.error("not in queue mode")
  process.exit()
}

prepareDependencies()
queue.process(config.queue.concurrency, processor)
serviceLogger.info("worker listening ...", {concurrency: config.queue.concurrency})