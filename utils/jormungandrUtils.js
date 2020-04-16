const fs                              = require('fs')
const { spawn }                       = require('child_process')

function jorStartNode(cnjNode) {

  const out = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stdout.txt', 'a')
  const err = fs.openSync('./jormungandr-logs/log-' + cnjNode.index + '-process-stderr.txt', 'a')

  let params =
    '--genesis-block-hash ' + cnjNode.genesis_block +
    ' --config ./configs/nodeconfig_' + cnjNode.index + '.yaml'

  if(cnjNode.poolsecret_yaml) {

    params += ' --secret ' + cnjNode.poolsecret_yaml
  }

  const jormungandr = spawn('./jormungandr-start.sh', [ params ], {
    detached: true,
    stdio: [ 'ignore', out, err ]
  });

  jormungandr.unref()
}

module.exports = { jorStartNode }
