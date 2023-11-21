const path = require("path")
const os = require("os")

const config = {
  isProxy: false,
  host: "127.0.0.1",
  port: 9000,
  cycloneExecutable: "cyclone.jar",
  cyclonePath: "D:\\mu\\cyclone-tutorial\\cyclone\\",
  cycloneTraceKeyword: "Trace Generated:",
  tempDir: path.join(os.tmpdir(), "cyclone_tutorial_backend"),
  deleteAfterRun: false,
  cycloneExtension: ".cyclone"
}

module.exports = config