import config from "../config.json" assert { type: "json" }
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {isWorker} from "./utils/env.js";
import path from "node:path";

const selectedLoggerConfig = isWorker ? config.logger.file.worker : config.logger.file.server
// const loggerConfig = {...selectedLoggerConfig, filename: path.join(config.logger.path, selectedLoggerConfig.filename)}

const transports = [
  new DailyRotateFile(selectedLoggerConfig)
]

if (config.logger.console) {
  transports.push(new winston.transports.Console())
}

const logger = winston.createLogger({
  transports,
  format: winston.format.json(),
  level: config.logger.level
})

export default logger