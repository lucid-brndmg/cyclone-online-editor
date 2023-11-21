const server = require("./src/server")
const fs = require("fs")
const config = require("./src/config");
const { exit } = require("process");
const path = require("path");

const initEnv = () => {
  const exec = path.join(config.cyclonePath, config.cycloneExecutable)
  if (!fs.existsSync(exec)) {
    console.log("cyclone executable does not exist");
    exit()
  } else {
    console.log("cyclone executable", exec);
  }
  
  if (!fs.existsSync(config.tempDir)) {
    console.log("creating temp src dir", config.tempDir);
    fs.mkdirSync(config.tempDir, {recursive: true})
  }

  console.log("env initialized");
}

const run = () => {
  initEnv()
  server.serve()
}

run()