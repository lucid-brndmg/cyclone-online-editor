import config from "./config.js"
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {isWorker} from "./utils/env.js";
import path from "node:path";

export const serviceLogger = (() => {
  const selectedLoggerConfig = isWorker ? config.logger.service.file.worker : config.logger.service.file.server

  const transports = [
    new DailyRotateFile(selectedLoggerConfig)
  ]

  if (config.logger.service.console) {
    transports.push(new winston.transports.Console())
  }

  return winston.createLogger({
    transports,
    // format: winston.format.json(),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    level: config.logger.service.level
  })
})()

export const executionLogger = (() => {
  const transports = [
    new DailyRotateFile(config.logger.execution.file)
  ]

  if (config.logger.execution.console) {
    transports.push(new winston.transports.Console())
  }

  return winston.createLogger({
    transports,
    format: winston.format.json(),
    level: config.logger.execution.level
  })
})()