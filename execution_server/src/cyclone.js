import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto";
import antlr4, {ParseTreeWalker} from "antlr4";
import config from "./config.js";
import {execFileAsync, execShellCommand, spawnAsync} from "./lib/system.js"
import CycloneLexer from "./generated/antlr/CycloneLexer.js";
import CycloneParser from "./generated/antlr/CycloneParser.js";
import CycloneParserListener from "./generated/antlr/CycloneParserListener.js";
import {ResponseCode} from "./definitions.js";

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

const checkProgram = program => {
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
    if (config.cycloneDisabledOptions.has(opt)) {
      invalidOptions.push(opt)
    }
  }

  if (invalidOptions.length) {
    return {invalidOptions}
  }

  return {}
}

export const execCycloneProgram = async (program) => {
  const {invalidOptions, syntaxError} = checkProgram(program)

  if (syntaxError) {
    return {code: ResponseCode.SyntaxError}
  }

  if (invalidOptions) {
    return {code: ResponseCode.InvalidOptions, data: invalidOptions}
  }

  const tmpFileId = crypto.randomUUID()
  const tmpFilename = tmpFileId + config.cycloneExtension
  const tmpPath = path.join(config.tempDir, tmpFilename)
  await fs.promises.writeFile(tmpPath, program, "utf-8")
  // const command = `java -jar ${config.cycloneExecutable} ${tmpPath}`
  const tmpFiles = [tmpPath]
  
  let traceContent = null
  // let result = await execShellCommand(command, {cwd: config.cyclonePath, timeout: config.cycloneMandatoryTimeoutMs})

  try {
    let result = await execFileAsync("java", ["-jar", config.cycloneExecutable, tmpPath], {cwd: config.cyclonePath, timeout: config.cycloneMandatoryTimeoutMs})

    if (!result) {
      // failed to execute, NOT failed to solve
      return {code: ResponseCode.UnsuccessfulExecution}
    }

    const spl = result.split(/[\r\n]+/)
    const traceLine = spl.find(line => line.startsWith(config.cycloneTraceKeyword))
    if (traceLine) {
      const tracePath = traceLine.slice(config.cycloneTraceKeyword.length).trim()
      // const existsTrace = tracePath // && (await fs.promises.access(tracePath, fs.constants.F_OK))
      if (tracePath) {
        tmpFiles.push(tracePath)
        try {
          traceContent = await fs.promises.readFile(tracePath, "utf-8")
        } catch (e) {
          console.log("error reading trace", e);
        }
      }
    }

    // DEFER
    if (config.deleteAfterRun) {
      await Promise.all(tmpFiles.map(p => fs.promises.rm(p, {force: true})))
    }

    let sanitizedResult = result, sanitizedTrace = traceContent
    const paths = [...tmpFiles, config.cyclonePath, config.tempDir, path.resolve(config.cyclonePath), path.resolve(config.tempDir), path.normalize(config.cyclonePath)]

    for (let p of paths) {
      sanitizedResult = sanitizedResult.replaceAll(p, "<path>")
      if (sanitizedTrace) {
        sanitizedTrace = sanitizedTrace.replaceAll(p, "<path>")
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
      }
    }
  } catch (e) {
    if (e?.killed && e?.signal === "SIGTERM") {
      return {code: ResponseCode.ExecutionTimeout, data: config.cycloneMandatoryTimeoutMs}
    }

    console.log(e)
    return {code: ResponseCode.InternalError}
  }
}