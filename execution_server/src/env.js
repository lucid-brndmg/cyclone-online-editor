import conf from "../config.json" assert { type: "json" };
import logger from "./logger.js";
import {exit} from "node:process";
import path from "node:path";
import fs from "node:fs";

export const prepareEnv = () => {
  // if (conf.queue.enabled && !conf.redis) {
  //   logger.error("No redis config prepared for queue.")
  //   exit()
  // }
  const exec = path.join(conf.cyclone.path, conf.cyclone.executable)

  if (!fs.existsSync(exec)) {
    logger.error("Cyclone executable does not exist");
    exit()
  } else {
    logger.info("Found cyclone executable", {path: exec});
  }

  if (!fs.existsSync(conf.cyclone.sourcePath)) {
    logger.info("sourcePath not exists. Creating", {path: conf.cyclone.sourcePath})
    fs.mkdirSync(conf.cyclone.sourcePath, {recursive: true})
  } else {
    logger.info("sourcePath found", {path: conf.cyclone.sourcePath})
  }

  if (conf.cyclone.mandatoryTimeoutMs <= 0) {
    logger.warn("No valid timeout for code execution. A program could take forever to execute!")
  }

  if (conf.cyclone.appendEnvPath) {
    const env = process.env["PATH"]
    process.env["PATH"] += `${env ? ";" : ""}${path.resolve(conf.cyclone.path)}`
  }

  logger.info("env ready")
}