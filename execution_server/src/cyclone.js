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
  const deferRemove = [tmpPath]
  
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
      deferRemove.push(tracePath)
      try {
        traceContent = await fs.promises.readFile(tracePath, "utf-8")
      } catch (e) {
        console.log("error reading trace", e);
      }
    }
  }

  // DEFER
  if (config.deleteAfterRun) {
    await Promise.all(deferRemove.map(p => fs.promises.rm(p, {force: true})))    
  }
  
  return {
    success: true, // successfully executed the shell command, NOT successfully COMPILED
    trace: traceContent
      ?.replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|js))/g, "<path>")
      ?.replace(/(\/[\w-]+)*([\w-]+)*\.(trace|cyclone|jar|js)/g, "<path>"),
    result: result
      .replace(/[a-zA-Z]:[\\\/](?:[\w\s\.-]+[\\\/])*([\w\s\.-]+\.(cyclone|trace|jar|js))/g, "<path>")
      .replace(/(\/[\w-]+)*([\w-]+)*\.(trace|cyclone|jar|js)/g, "<path>"),
  }
}

module.exports = {
  execCycloneProgram
}