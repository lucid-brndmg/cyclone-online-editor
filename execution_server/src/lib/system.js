const execShellCommand = (cmd, opts) => {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (error, stdout, stderr) => {
      // console.log("stderr", stderr);
      // console.log("stdout", stdout);
      if (error) {
        reject(error)
      }
      console.error("exec:", stderr, stdout)
      resolve([stderr, stdout].filter(s => !!s).join("\n"));
    });
  });
}

const spawnAsync = (cmd, args, onData, opts) => new Promise((resolve, reject) => {
  const s = childProcess.spawn(cmd, args, opts)
  s.stdout.on('data', onData)

  s.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    reject(data.toString())
  });

  s.on('close', (code) => {
    resolve(code)
  });

  return s
})

module.exports = {
  execShellCommand,
  spawnAsync,
}