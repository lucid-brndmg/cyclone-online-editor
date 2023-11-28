import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto";
import antlr4, {ParseTreeWalker} from "antlr4";
import config from "../config.json" assert { type: "json" };
import {execFileAsync, execShellCommand, spawnAsync} from "./lib/system.js"
import CycloneLexer from "./generated/antlr/CycloneLexer.js";
import CycloneParser from "./generated/antlr/CycloneParser.js";
import CycloneParserListener from "./generated/antlr/CycloneParserListener.js";
import {ResponseCode} from "./definitions.js";
import logger from "./logger.js";

// const regexOption = /option-\s*\w+\s*=.*[^;];/gm

// Regex would be not accurate here
// Option syntax could also be appeared to in strings or labels
class ValidationListener extends CycloneParserListener {
  options = new Set()

  enterCompOptions(ctx) {
    const optName = ctx.children[1]?.children[0]?.symbol?.text
    // const value = ctx.children[3]?.children[0]?.children[0]?.symbol?.text

    this.options.add(optName)
  }
}

export const checkProgram = program => {
  const stream = new antlr4.InputStream(program)
  const lexer = new CycloneLexer(stream)
  lexer.removeErrorListeners()
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new CycloneParser(tokens)
  parser.removeErrorListeners()

  const tree = parser.machine()
  if (parser.syntaxErrorsCount > 0) {
    return {syntaxError: true}
  }
  const listener = new ValidationListener()
  ParseTreeWalker.DEFAULT.walk(listener, tree)

  const invalidOptions = []

  for (let opt of listener.options) {
    if (config.cyclone.disabledOptions.includes(opt)) {
      invalidOptions.push(opt)
    }
  }

  if (invalidOptions.length) {
    return {invalidOptions}
  }

  return {}
}

export const execCycloneProgram = async (program, id) => {
  const tmpFilename = id + config.cyclone.extension
  const srcPath = config.cyclone.sourcePath
  const tmpPath = path.join(srcPath, tmpFilename)
  await fs.promises.writeFile(tmpPath, program, "utf-8")
  // const command = `java -jar ${config.cycloneExecutable} ${tmpPath}`
  const tmpFiles = [tmpPath]
  
  let traceContent = null
  // let result = await execShellCommand(command, {cwd: config.cyclonePath, timeout: config.cycloneMandatoryTimeoutMs})

  try {
    let result = await execFileAsync("java", ["-jar", path.join(config.cyclone.path, config.cyclone.executable), tmpPath], {cwd: srcPath, timeout: config.cyclone.mandatoryTimeoutMs}) // cwd: config.cyclone.path,

    if (!result) {
      // failed to execute, NOT failed to solve
      return {code: ResponseCode.UnsuccessfulExecution}
    }

    const spl = result.split(/[\r\n]+/)
    const traceLine = spl.find(line => line.startsWith(config.cyclone.traceKeyword))
    if (traceLine) {
      const tracePath = traceLine.slice(config.cyclone.traceKeyword.length).trim()
      // const existsTrace = tracePath // && (await fs.promises.access(tracePath, fs.constants.F_OK))
      if (tracePath) {
        tmpFiles.push(tracePath)
        try {
          traceContent = await fs.promises.readFile(tracePath, "utf-8")
        } catch (error) {
          logger.error("error reading trace", {error});
        }
      }
    }

    // DEFER
    if (config.cyclone.deleteAfterExec && tmpFiles.length) {
      await Promise.all(tmpFiles.map(p => fs.promises.rm(p, {force: true})))
    }

    let sanitizedResult = result, sanitizedTrace = traceContent
    const paths = [...tmpFiles, config.cyclone.path, config.cyclone.sourcePath, path.resolve(config.cyclone.path), path.resolve(config.cyclone.sourcePath), path.normalize(config.cyclone.path)]

    for (let p of paths) {
      sanitizedResult = sanitizedResult.replaceAll(p, "<censored-path>")
      if (sanitizedTrace) {
        sanitizedTrace = sanitizedTrace.replaceAll(p, "<censored-path>")
      }
    }

    // return {
    //   success: true, // successfully executed the shell command, NOT successfully COMPILED
    //   // trace: traceContent
    //   //   ?.replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|dot))/g, "<path>")
    //   //   ?.replace(/(\/[\w-]+)*([\w-]+)\.(trace|cyclone|jar|dot)/g, "<path>"),
    //   // result: result
    //   //   .replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|dot))/g, "<path>")
    //   //   .replace(/(\/[\w-]+)*([\w-]+)\.(trace|cyclone|jar|dot)/g, "<path>"),
    //
    //   // trace: traceContent?.replaceAll(tracePath)
    //
    //   result: sanitizedResult,
    //   trace: sanitizedTrace
    // }

    return {
      code: ResponseCode.Success,
      data: {
        trace: sanitizedTrace,
        result: sanitizedResult,
      },
      garbage: tmpFiles
    }
  } catch (e) {
    if (e?.killed && e?.signal === "SIGTERM") {
      return {code: ResponseCode.ExecutionTimeout, data: config.cyclone.mandatoryTimeoutMs}
    }

    logger.error("cyclone execution error", {error: e})
    return {code: ResponseCode.InternalError}
  }
}