import {execFileAsync} from "../lib/system.js";

export const isWorker = process.argv.some(arg => arg.endsWith("worker.js"))