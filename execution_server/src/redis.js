import config from "./config.js"
import { createClient } from 'redis';
import {serviceLogger} from "./logger.js";
import {exit} from "node:process";

let redis

if (config.queue.enabled && !config.redis) {
  serviceLogger.error("No redis config prepared for queue.")
  exit()
}

if (config.queue.enabled) {
  redis = await createClient(config.redis)
    .on("error", error => serviceLogger.log("redis error", {error}))
    .connect()
}

export default redis