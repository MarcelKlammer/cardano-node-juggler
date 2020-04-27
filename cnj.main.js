const { updateAllCardanoNodeStats }   = require('./js/utils/cardano.node.utils.js')
const { updateAllCardanoNodeLeaders } = require('./js/utils/cardano.node.utils.js')
const { updateAllCardanoNodeSettings }= require('./js/utils/cardano.node.utils.js')

const { updateAllCNJNodeStates }      = require('./js/utils/node.utils.js')
const { updateAllCNJNodeBlocks }      = require('./js/utils/node.utils.js')
const { updateAllCNJNodeScores }      = require('./js/utils/node.utils.js')
const { restartCNJNodeByScore }       = require('./js/utils/node.utils.js')

const { chooseAllCNJNodeLeaders }     = require('./js/utils/leader.utils.js')

const { printScreen }                 = require('./js/utils/print.utils.js')

const { timerStart }                 = require('./js/utils/timer.utils.js')
const { timerEnd }                   = require('./js/utils/timer.utils.js')

let _cnjMainLoopId                    = -1

const cnjMainLoop = async (nodeConfigList) => {

  timerStart()

  clearTimeout(_cnjMainLoopId)

  await updateAllCardanoNodeStats()
  await updateAllCardanoNodeLeaders()
  await updateAllCardanoNodeSettings()

  updateAllCNJNodeStates()
  updateAllCNJNodeBlocks()
  updateAllCNJNodeScores()

  //console.dir(cnjNodeList, { depth: 3 })

  restartCNJNodeByScore()

  chooseAllCNJNodeLeaders()

  // what's the up time for the node?
  // see whether they  are well connected

  // if well connected, load the last blocks?

  // Node is Starting:
  // uptime < 240 seconds

  printScreen()

  console.log('processing time: ', timerEnd().timeDiff.toFixed(0) + 'ms')

  _cnjMainLoopId = setTimeout(cnjMainLoop, 500, nodeConfigList)
}

module.exports = { cnjMainLoop }
