import Queue from "bee-queue"
import redis from "./redis.js";
import config from "./config.js"
import {isWorker} from "./utils/env.js";
let cycloneQueue

// if is queue mode then init bee queue instance
if (config.queue.enabled) {
  cycloneQueue = new Queue("cyclone_exec", {
    redis,
    getEvents: false,
    isWorker
  })
}

export default cycloneQueue