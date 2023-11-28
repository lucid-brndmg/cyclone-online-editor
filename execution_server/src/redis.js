import config from "../config.json" assert { type: "json" };
import { createClient } from 'redis';
import logger from "./logger.js";
import {exit} from "node:process";

let redis

if (config.queue.enabled && !config.redis) {
  logger.error("No redis config prepared for queue.")
  exit()
}

if (config.queue.enabled) {
  redis = await createClient(config.redis)
    .on("error", error => logger.log("redis error", {error}))
    .connect()
}

export default redis