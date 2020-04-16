const { exec } = require('child_process')

const execShellCommand = (cmd) => {

  return new Promise((resolve) => {

    exec(cmd, (error, stdout, stderr) => {

      resolve(stdout ? stdout : stderr)
    });
  });
}

module.exports = { execShellCommand }
