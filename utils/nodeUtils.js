const { writeTextFileAsync }          = require('./fileUtils.js')
const { readTextFileAsync }           = require('./fileUtils.js')
const { appendJsonFile }              = require('./fileUtils.js')

const { JcliState }                   = require('./jcliUtils.js')
const { jcliGetSettings }             = require('./jcliUtils.js')
const { jcliGetNodeStats }            = require('./jcliUtils.js')
const { jcliGetShutdown }             = require('./jcliUtils.js')
const { jcliGetBlock }                = require('./jcliUtils.js')
const { jcliGetLeaders }              = require('./jcliUtils.js')
const { jcliDemoteLeader }            = require('./jcliUtils.js')
const { jcliPromoteLeader }           = require('./jcliUtils.js')

const { jorStartNode }                = require('./jormungandrUtils.js')

const { sleep }                       = require('./timerUtils.js')
const { getTimeDifferenceInSeconds }  = require('./timerUtils.js')

const NodeState = {

  Uninitialized:      'Uninitialized',
  Failing:            'Failing',
  Starting:           'Starting',
  Running:            'Running'
}

const prepareNode = (cnjNode, index, name_prefix, genesis_block, poolsecret_yaml, pool_id, pooltool_user_id) => {

  cnjNode.index           = index
  cnjNode.name            = name_prefix + index
  cnjNode.genesis_block   = genesis_block
  cnjNode.poolsecret_yaml = poolsecret_yaml
  cnjNode.blockHeight     = 0
  cnjNode.stats           = { state: JcliState.Uninitialized }
  cnjNode.isLeader        = false
  cnjNode.receivedBlocks  = []
  cnjNode.score           = 1
  cnjNode.state           = NodeState.Uninitialized
  cnjNode.state_entered   = new Date()

  cnjNode.pool_id         = pool_id
  cnjNode.pooltool_user_id= pooltool_user_id
}

const shutdownNode = async (nodeConfig) => {

  const { shutdown } = await jcliGetShutdown(nodeConfig.rest.listen)

  if(shutdown) {

    console.log(nodeConfig.cnj.name, 'shutdown: Success, sleep: 5000ms')

    await sleep(5000)
  }
}

const restartNode = async (nodeConfig, force) => {

  setNodeStarting(nodeConfig.cnj, force)

  await shutdownNode(nodeConfig)

  jorStartNode(nodeConfig.cnj)
}

const isNodeFailing   = (cnjNode) => cnjNode.state === NodeState.Failing
const isNodeStarting  = (cnjNode) => cnjNode.state === NodeState.Starting
const isNodeRunning   = (cnjNode) => cnjNode.state === NodeState.Running

const setNodeFailing = (cnjNode) => {

  cnjNode.state = NodeState.Failing
  cnjNode.state_entered = new Date()
}

const setNodeStarting = (cnjNode, force) => {

  if(isNodeFailing(cnjNode) || force) {

    if(!force) {

      force = (new Date().getTime() - cnjNode.state_entered.getTime()) / 1000 > 5.0
    }

    if(force) {

      cnjNode.state           = NodeState.Starting
      cnjNode.state_entered   = new Date()
      cnjNode.blockHeight     = 0

      cnjNode.stats           = { state: JcliState.Uninitialized }
      cnjNode.isLeader        = false
      cnjNode.receivedBlocks  = []
      cnjNode.score           = 1

      return true
    }
  }

  return false
}

const getNodeStartingTime = (cnjNode) => {

  return getTimeDifferenceInSeconds(new Date(), cnjNode.state_entered)
}

const setNodeRunning = (cnjNode) => {

  cnjNode.state = NodeState.Running
  cnjNode.state_entered = new Date()
}

const getNodeStats = async (nodeConfig) => {

  const stats         = await jcliGetNodeStats(nodeConfig.rest.listen)
  const currentStats  = JSON.stringify(stats, null, 2)

  const statsName     = './stats/stats-' + nodeConfig.cnj.index + '.json'

  if(await readTextFileAsync(statsName) !== currentStats) { // only overwrite file, if changes happened.

    await writeTextFileAsync(statsName, currentStats)
  }

  nodeConfig.cnj.stats = stats

  return stats
}

const getBlock = async (nodeConfig, blockHash) => {

  return await jcliGetBlock(nodeConfig.rest.listen, blockHash)
}

const handleNodeStats = async (nodeConfig, cnjNode, block, stats) => {

  const leaderIds = await jcliGetLeaders(nodeConfig.rest.listen)

  cnjNode.isLeader = leaderIds.length > 0

  // const block = createBlock(stats)
  //
  // console.dir(block, { depth: null })
}

const getNodeSettings = async (nodeConfig) => {

  return await jcliGetSettings(nodeConfig.rest.listen)
}

const demoteLeader = async (nodeConfig) => {

  let leaderIds = await jcliGetLeaders(nodeConfig.rest.listen)

  if(leaderIds.length > 0) {

    console.log('demoteLeader', nodeConfig.cnj.name)

    for(var i = 0; i < leaderIds.length; i++) {

      await jcliDemoteLeader(nodeConfig.rest.listen, leaderIds[i])
    }

    leaderIds = await jcliGetLeaders(nodeConfig.rest.listen)
  }

  nodeConfig.cnj.isLeader = leaderIds.length > 0
}

const promoteLeader = async (nodeConfig) => {

  let leaderIds = await jcliGetLeaders(nodeConfig.rest.listen)

  if(leaderIds.length === 0) {

    console.log('promoteLeader', nodeConfig.cnj.name)

    await jcliPromoteLeader(nodeConfig.rest.listen)

    leaderIds = await jcliGetLeaders(nodeConfig.rest.listen)
  }

  nodeConfig.cnj.isLeader = leaderIds.length > 0
}

const storeBlock = async (cnjNode, block) => {

  const epoch       = block.blockDate.split('.')[0]
  const logFileName = './blocks/blocks-' + epoch + '-' + cnjNode.index + '.json'


  cnjNode.blockHeight = block.blockHeight

  appendJsonFile(logFileName, JSON.stringify(block) + '\n')
}

module.exports = {

  NodeState,

  prepareNode,
  restartNode,

  demoteLeader,
  promoteLeader,

  getNodeStats,
  handleNodeStats,
  getNodeSettings,

  isNodeRunning,  setNodeRunning,
  isNodeStarting, setNodeStarting, getNodeStartingTime,
  isNodeFailing,  setNodeFailing,

  getBlock,
  storeBlock
}
