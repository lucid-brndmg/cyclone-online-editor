import conf from "../config.json" assert { type: "json" };
import {serviceLogger} from "./logger.js";
import {exit} from "node:process";
import path from "node:path";
import fs from "node:fs";

export const prepareDependencies = () => {
  // if (conf.queue.enabled && !conf.redis) {
  //   logger.error("No redis config prepared for queue.")
  //   exit()
  // }
  const exec = path.join(conf.cyclone.path, conf.cyclone.executable)

  if (!fs.existsSync(exec)) {
    serviceLogger.error("Cyclone executable does not exist");
    exit()
  } else {
    serviceLogger.info("Found cyclone executable", {path: exec});
  }

  if (!fs.existsSync(conf.cyclone.sourcePath)) {
    serviceLogger.info("sourcePath not exists. Creating", {path: conf.cyclone.sourcePath})
    fs.mkdirSync(conf.cyclone.sourcePath, {recursive: true})
  } else {
    serviceLogger.info("sourcePath found", {path: conf.cyclone.sourcePath})
  }

  if (conf.cyclone.mandatoryTimeoutMs <= 0) {
    serviceLogger.warn("No valid timeout for code execution. A program could take forever to execute!")
  }

  if (conf.cyclone.appendEnvPath) {
    const env = process.env["PATH"]
    process.env["PATH"] += `${env ? ";" : ""}${path.resolve(conf.cyclone.path)}`
  }

  serviceLogger.info("ready")
}