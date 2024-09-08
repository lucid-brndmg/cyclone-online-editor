/*
* Code validator module + Code execution module
* */

import path from "node:path"
import fs from "node:fs"
import config from "./config.js"
import {execFileAsync} from "./lib/system.js"
import {ResponseCode} from "./definitions.js";
import {executionLogger, serviceLogger} from "./logger.js";
import {customSlice} from "./lib/string.js";
import cycloneAnalyzer from "cyclone-analyzer"

// runs once at server start
export const registerCycloneVersion = async () => {
  const args = ["-jar", path.join(config.cyclone.path, config.cyclone.executable), "--version"]
  const opts = {cwd: config.cyclone.sourcePath}
  return global.cycloneVersion = await execFileAsync("java", args, opts)
}

export const getCycloneVersion = () => {
  return global.cycloneVersion
}

// const regexOption = /option-\s*\w+\s*=.*[^;];/gm

// Regex would be not accurate here
// Option syntax could also be appeared to in strings or labels
class ValidationListener extends cycloneAnalyzer.generated.antlr.CycloneParserListener {
  options = new Set()

  enterCompOptions(ctx) {
    const optName = ctx.children[1]?.children[0]?.symbol?.text
    // const value = ctx.children[3]?.children[0]?.children[0]?.symbol?.text

    this.options.add(optName)
  }
}

export const checkProgram = program => {
  // const stream = new antlr4.InputStream(program)
  // const lexer = new CycloneLexer(stream)
  // lexer.removeErrorListeners()
  // const tokens = new antlr4.CommonTokenStream(lexer)
  // const parser = new CycloneParser(tokens)
  // parser.removeErrorListeners()
  //
  // const tree = parser.program()
  const parsed = cycloneAnalyzer.utils.antlr.parseCycloneSyntax({input: program})
  if (parsed.syntaxErrorsCount > 0) {
    return {syntaxError: true}
  }
  const listener = new ValidationListener()
  cycloneAnalyzer.utils.antlr.listenerWalk(listener, parsed.tree)
  // ParseTreeWalker.DEFAULT.walk(listener, tree)

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

export const logResult = (input, result, args, execOpts, id) => {
  const patterns = config.logger.execution.patterns
  if (!patterns.length) {
    return
  }
  for (let i = 0; i < patterns.length; i ++) {
    const {re, reFlag, level, sliceInput, sliceOutput} = patterns[i]
    // v8 automatically caches regex
    // see https://stackoverflow.com/questions/14352100/does-v8-cache-compiled-regular-expressions-automatically
    const reInst = new RegExp(re, reFlag ?? undefined)

    if (reInst.test(result)) {
      executionLogger[level]({
        output: customSlice(result, sliceOutput),
        input: customSlice(input, sliceInput),
        args, execOpts, patternIndex: i,
        id
      })
      break
    }
  }
}

// execute Cyclone program
export const execCycloneProgram = async (program, id) => {
  const tmpFilename = id + config.cyclone.extension
  const srcPath = config.cyclone.sourcePath
  const tmpPath = path.join(srcPath, tmpFilename)
  await fs.promises.writeFile(tmpPath, program, "utf-8")
  // const command = `java -jar ${config.cycloneExecutable} ${tmpPath}`
  const tmpFiles = [tmpPath, path.join(srcPath, tmpFilename + ".smt2")]
  
  let traceContent = null
  // let result = await execShellCommand(command, {cwd: config.cyclonePath, timeout: config.cycloneMandatoryTimeoutMs})

  try {
    const args = ["-jar", path.join(config.cyclone.path, config.cyclone.executable), tmpPath, "--nocolor"]
    const opts = {cwd: srcPath, timeout: config.cyclone.mandatoryTimeoutMs}

    let result = (await execFileAsync("java", args, opts))
      // clear colors
      .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

    if (!result) {
      // failed to execute, NOT failed to solve
      return {code: ResponseCode.UnsuccessfulExecution}
    }

    logResult(program, result, args, opts, id)

    const spl = result.split(/[\r\n]+/)
    const traceLine = spl.find(line => line.startsWith(config.cyclone.traceKeyword))
    if (traceLine) {
      const tracePath = traceLine.slice(config.cyclone.traceKeyword.length).trim()
      if (tracePath) {
        tmpFiles.push(tracePath)
        try {
          traceContent = await fs.promises.readFile(tracePath, "utf-8")
        } catch (error) {
          serviceLogger.error("error reading trace", {error, id});
        }
      }
    }

    // DEFER
    if (config.cyclone.deleteAfterExec && tmpFiles.length) {
      await Promise.all(tmpFiles.map(p => fs.promises.rm(p, {force: true})))
    }

    let sanitizedResult = result, sanitizedTrace = traceContent

    if (config.cyclone.censorSystemPaths) {
      const paths = [...tmpFiles, config.cyclone.path, config.cyclone.sourcePath, path.resolve(config.cyclone.path), path.resolve(config.cyclone.sourcePath), path.normalize(config.cyclone.path)]

      for (let p of paths) {
        sanitizedResult = sanitizedResult.replaceAll(p, "<censored-path>")
        if (sanitizedTrace) {
          sanitizedTrace = sanitizedTrace.replaceAll(p, "<censored-path>")
        }
      }
    }

    return {
      code: ResponseCode.Success,
      data: {
        trace: sanitizedTrace,
        result: sanitizedResult,
      },
      garbage: tmpFiles
    }
  } catch (e) {
    if (config.cyclone.deleteAfterExec && tmpFiles.length) {
      await Promise.all(tmpFiles.map(p => fs.promises.rm(p, {force: true})))
    }

    if (e?.killed) {
      return {code: ResponseCode.ExecutionTimeout, data: config.cyclone.mandatoryTimeoutMs, garbage: tmpFiles}
    }

    serviceLogger.error("cyclone execution error", {error: e, id})
    return {code: ResponseCode.InternalError, garbage: tmpFiles}
  }
}