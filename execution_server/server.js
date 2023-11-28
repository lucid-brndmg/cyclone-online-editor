import path from "node:path";
import fs from "node:fs";
import {serve} from "./src/server.js"
import {exit} from "node:process"
import logger from "./src/logger.js";
import {prepareEnv} from "./src/env.js";

// const initEnv = () => {
//   const exec = path.join(config.cyclonePath, config.cycloneExecutable)
//   if (!fs.existsSync(exec)) {
//     console.log("cyclone executable does not exist");
//     exit()
//   } else {
//     console.log("cyclone executable", exec);
//   }
//
//   if (!fs.existsSync(config.tempDir)) {
//     console.log("creating temp src dir", config.tempDir);
//     fs.mkdirSync(config.tempDir, {recursive: true})
//   }
//
//   if (config.cycloneMandatoryTimeoutMs <= 0) {
//     console.log("WARN: No valid timeout seconds was set, a program could take forever to execute!!")
//   }
//
//   console.log("env initialized");
// }

const run = () => {
  prepareEnv()
  serve()
}

run()