import config from "../config.json" assert { type: "json" }
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const transports = [
  new DailyRotateFile(config.logger.file)
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