const fs                              = require('fs')
const { spawn }                       = require('child_process')

function jormungandrStartNode(cnjNode) {

  const out = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stdout.txt', 'a')
  const err = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stderr.txt', 'a')

  let params =
    '--genesis-block-hash ' + cnjNode.genesisBlock +
    ' --config ./configs/nodeconfig_' + cnjNode.index + '.yaml'

  if(cnjNode.poolsecretYaml) {

    params += ' --secret ' + cnjNode.poolsecretYaml
  }

  const jormungandr = spawn('./jormungandr-start.sh', [ params ], {
    detached: true,
    stdio: [ 'ignore', out, err ]
  });

  // jormungandr.stdout.on('data', (data) => {
  //   console.log(`stdout: ${data}`);
  // });
  //
  // jormungandr.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });
  //
  // jormungandr.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });

  jormungandr.unref()
}

module.exports = { jormungandrStartNode }
