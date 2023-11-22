import {exec, spawn, execFile} from "node:child_process"

export const execShellCommand = (cmd, opts) => {
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (error, stdout, stderr) => {
      // console.log("stderr", stderr);
      // console.log("stdout", stdout);
      if (error) {
        reject(error)
      }
      resolve([stderr, stdout].filter(s => !!s).join("\n"));
    });
  });
}

export const execFileAsync = (cmd, args, opts) => {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve([stderr, stdout].filter(s => !!s).join("\n"));
    });
  });
};

export const spawnAsync = (cmd, args, onData, opts) => new Promise((resolve, reject) => {
  const s = spawn(cmd, args, opts)
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