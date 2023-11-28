import Queue from "bee-queue"
import redis from "./redis.js";
import config from "../config.json" assert { type: "json" };
let cycloneQueue

if (config.queue.enabled) {
  cycloneQueue = new Queue("cyclone_exec", {
    redis,
    getEvents: false,
    isWorker: process.argv.some(arg => arg.endsWith("worker.js"))
  })
}

export default cycloneQueue