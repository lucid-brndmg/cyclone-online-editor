const path = require("path")
const config = require("./config")
const fs = require("fs")
const crypto = require("crypto")
const { execShellCommand, spawnAsync } = require("./lib/system")

const execCycloneProgram = async (program) => {
  const tmpFileId = crypto.randomUUID()
  const tmpFilename = tmpFileId + config.cycloneExtension
  const tmpPath = path.join(config.tempDir, tmpFilename)
  console.log("write file to", tmpPath);
  await fs.promises.writeFile(tmpPath, program, "utf-8")
  const command = `java -jar ${config.cycloneExecutable} ${tmpPath}`
  const tmpFiles = [tmpPath]
  
  let traceContent = null
  let result = await execShellCommand(command, {cwd: config.cyclonePath})
  
  if (!result) {
    // failed to execute, NOT failed to solve
    return {success: false}
  }

  const spl = result.split(/[\r\n]+/)
  const traceLine = spl.find(line => line.startsWith(config.cycloneTraceKeyword))
  if (traceLine) {
    const tracePath = traceLine.slice(config.cycloneTraceKeyword.length).trim()
    console.log("read trace file", tracePath);
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

  return {
    success: true, // successfully executed the shell command, NOT successfully COMPILED
    // trace: traceContent
    //   ?.replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|dot))/g, "<path>")
    //   ?.replace(/(\/[\w-]+)*([\w-]+)\.(trace|cyclone|jar|dot)/g, "<path>"),
    // result: result
    //   .replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|dot))/g, "<path>")
    //   .replace(/(\/[\w-]+)*([\w-]+)\.(trace|cyclone|jar|dot)/g, "<path>"),
    
    // trace: traceContent?.replaceAll(tracePath)

    result: sanitizedResult,
    trace: sanitizedTrace
  }
}

module.exports = {
  execCycloneProgram
}