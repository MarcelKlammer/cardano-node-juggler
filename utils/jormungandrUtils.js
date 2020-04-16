const fs                              = require('fs')
const { spawn }                       = require('child_process')

function jorStartNode(cnjNode) {

  const out = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stdout.txt', 'a')
  const err = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stderr.txt', 'a')

  const jormungandr = spawn('./jormungandr-start.sh', [
    '--genesis-block-hash ' + cnjNode.genesis_block +
    ' --config ./configs/nodeconfig_' + cnjNode.index + '.yaml' +
    ' --secret ' + cnjNode.poolsecret_yaml
  ], {
    detached: true,
    stdio: [ 'ignore', out, err ]
  });

  jormungandr.unref()
}

module.exports = { jorStartNode }
