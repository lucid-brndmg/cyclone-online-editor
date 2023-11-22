import path from "node:path"
import os from "node:os"

const config = {
  isProxy: false,
  host: "127.0.0.1",
  port: 9000,
  cycloneExecutable: "cyclone.jar",
  cyclonePath: "D:\\mu\\cyclone-tutorial\\cyclone\\",
  cycloneTraceKeyword: "Trace Generated:",
  tempDir: path.join(os.tmpdir(), "cyclone_tutorial_backend"),
  deleteAfterRun: false,
  cycloneExtension: ".cyclone",
  cycloneDisabledOptions: new Set([
    "debug",
    "log",
  ]),
  cycloneMandatoryTimeoutMs: 2000
}

export default config