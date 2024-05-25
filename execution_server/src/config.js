// import config from "../config.json" assert { type: "json" };
import fs from "node:fs"
import "dotenv/config"
import * as url from "node:url";
import path from "node:path"
import {parseBool} from "./lib/string.js";
import {exit} from "node:process";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const confPath = process.argv[2] || path.join(__dirname, "../config.json")

if (!fs.existsSync(confPath)) {
  console.log("Unknown config file:", confPath)
  console.log("Usage: node [server.js|worker.js] [config_file.json]")
  exit()
}

const config = JSON.parse(fs.readFileSync(confPath, "utf8"))
const ENV_PREFIX = "CYCLONE_ES_"

for (let key of ["cyclone", "queue", "redis", "server", "logger"]) {
  if (!config[key]) {
    config[key] = {}
    console.log("warn: configuration not found:", key, ", defined as {}")
  }
}

// read .env
Object
  .keys(process.env)
  .filter(key => key.startsWith(ENV_PREFIX))
  .map(key => ({key: key.slice(ENV_PREFIX.length).toUpperCase(), value: process.env[key]}))
  .forEach(({key, value}) => {
    switch (key) {
      case "CYCLONE_PATH": config.cyclone.path = value; break;
      case "CYCLONE_EXECUTABLE": config.cyclone.executable = value; break;
      case "CYCLONE_APPEND_ENV": config.cyclone.appendEnvPath = parseBool(value); break;
      case "CYCLONE_SOURCE_PATH": config.cyclone.sourcePath = value; break;
      case "CYCLONE_TIMEOUT_MS": config.cyclone.mandatoryTimeoutMs = parseInt(value); break;
      case "CYCLONE_ID_LENGTH": config.cyclone.idLength = parseInt(value); break;
      case "CYCLONE_TRACE_KEYWORD": config.cyclone.traceKeyword = value; break;
      case "CYCLONE_DEL_AFTER_EXEC": config.cyclone.deleteAfterExec = parseBool(value); break;
      case "CYCLONE_EXTENSION": config.cyclone.extension = value; break;
      case "CYCLONE_DISABLED_OPTIONS": config.cyclone.disabledOptions = value.split(/\s*,\s*/); break;
      case "CYCLONE_CENSOR_SYSTEM_PATHS": config.cyclone.censorSystemPaths = parseBool(value); break;

      case "QUEUE_ENABLED": config.queue.enabled = parseBool(value);  break;
      case "QUEUE_CONCURRENCY": config.queue.concurrency = parseInt(value); break;
      case "QUEUE_RESULT_TTL_SECS": config.queue.resultTTLSecs = parseInt(value); break;
      case "QUEUE_AUTO_CLEAR_FILE_MS": config.queue.autoClearFileIntervalMs = parseInt(value); break;

      case "REDIS_URL": config.redis.url = value; break;

      case "SERVER_HOST": config.server.host = value; break;
      case "SERVER_PORT": config.server.port = parseInt(value); break;
      case "SERVER_PROXY": config.server.isProxy = parseBool(value); break;
      case "SERVER_PROXY_HEADER": config.server.proxyIpHeader = value; break;

      case "LOGGER_SERVICE_CONSOLE": config.logger.service.console = parseBool(value); break;
      case "LOGGER_SERVICE_LEVEL": config.logger.service.level = value; break;
      case "LOGGER_EXECUTION_CONSOLE": config.logger.execution.console = parseBool(value); break;
      case "LOGGER_EXECUTION_LEVEL": config.logger.execution.level = value; break;

      default: console.log("Unknown config key: ", key, ":", value); break;
    }
  })

console.log("Config loaded", JSON.stringify(config, null, 2))

export default config