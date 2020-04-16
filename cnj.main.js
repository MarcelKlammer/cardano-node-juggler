const colors                          = require('colors');
const { version }                     = require('./package.json')

const { writeTextFile }               = require('./utils/fileUtils.js')

const { isJcliFailing }               = require('./utils/jcliUtils.js')
const { isJcliStarting }              = require('./utils/jcliUtils.js')
const { isJcliRunning }               = require('./utils/jcliUtils.js')

const { NodeState }                   = require('./utils/nodeUtils.js')
const { prepareNode }                 = require('./utils/nodeUtils.js')

const { isNodeStarting }              = require('./utils/nodeUtils.js')
const { setNodeStarting }             = require('./utils/nodeUtils.js')
const { getNodeStartingTime }         = require('./utils/nodeUtils.js')

const { isNodeRunning }               = require('./utils/nodeUtils.js')
const { setNodeRunning }              = require('./utils/nodeUtils.js')

const { isNodeFailing }               = require('./utils/nodeUtils.js')
const { setNodeFailing }              = require('./utils/nodeUtils.js')

const { restartNode }                 = require('./utils/nodeUtils.js')

const { getNodeSettings }             = require('./utils/nodeUtils.js')
const { getNodeStats }                = require('./utils/nodeUtils.js')
const { handleNodeStats }             = require('./utils/nodeUtils.js')

const { createBlock }                 = require('./utils/blockUtils.js')
const { addBlockToGlobalList }        = require('./utils/blockUtils.js')
const { addBlockToNodeList }          = require('./utils/blockUtils.js')
const { calculateScoreFromBlocks }    = require('./utils/blockUtils.js')
const { getLastBlockHeights }         = require('./utils/blockUtils.js')
const { getLastBlock }                = require('./utils/blockUtils.js')

const { chooseLeaderBasedOnScore }    = require('./utils/leaderUtils.js')
const { promoteAllNodesToLeaders }    = require('./utils/leaderUtils.js')

const { sendTipToPoolTool }           = require('./utils/pooltoolUtils.js')

const { getTimeDifferenceInSeconds }  = require('./utils/timerUtils.js')

let _settings                         = null
let _currentTime                      = null
let _eposhStartTime                   = null

const pullNodeStats = async (nodeConfigList) => {

  const jcliCalls = []

  for(let i = 0; i < nodeConfigList.length; i++) {

    jcliCalls.push(getNodeStats(nodeConfigList[i])) // storing all promises
  }

  return await Promise.all(jcliCalls); // resolve all promises
}

const setNodeStates = async (nodeConfigList, jcliResults) => {

  let nodeStarting = false // only start one node at a time

  for(let i = 0; i < jcliResults.length; i++) {

    const nodeConfig  = nodeConfigList[i]
    const cnjNode     = nodeConfig.cnj
    const result      = jcliResults[i]
    const jcliState   = result.state

    nodeStarting = nodeStarting || (isNodeStarting(cnjNode) && getNodeStartingTime(cnjNode) < 20.0)

    if(isJcliFailing(jcliState)) {

      if(isNodeStarting(cnjNode)) {

        console.log('start time', getNodeStartingTime(cnjNode))

        if(getNodeStartingTime(cnjNode) > 240.0) {

          nodeStarting = true

          restartNode(nodeConfig, true)
        }

      } else {

        if(cnjNode.state !== NodeState.Failing) {

          setNodeFailing(cnjNode)

        } else if(!nodeStarting && setNodeStarting(cnjNode)) {

          // Over 5 seconds past, restart jormungandr.

          nodeStarting = true

          restartNode(nodeConfig)
        }
      }

    } else {

      if(isJcliStarting(jcliState)) {

        if(!isNodeStarting(cnjNode)) {

          setNodeStarting(cnjNode, true)

        } else {

          if(getNodeStartingTime(cnjNode) > 240.0) {

            nodeStarting = true

            restartNode(nodeConfig, true)
          }
        }

      } else if(isJcliRunning(jcliState)) {

        !isNodeRunning(cnjNode) && setNodeRunning(cnjNode)

        const block = createBlock(result)

        if(addBlockToGlobalList(block)) {

          sendTipToPoolTool(nodeConfig, cnjNode, block)
        }

        addBlockToNodeList(cnjNode, block)
        handleNodeStats(nodeConfig, cnjNode, block, result)

        if(!_settings) {

          _settings = await getNodeSettings(nodeConfig)


          if(_settings && _settings.block0Time) {

            _settings.block0Time = new Date(_settings.block0Time)
            _eposhStartTime = new Date(_settings.block0Time.getTime() % 86400000)
          }
        }
      }
    }
  }
}

const setNodeScores = (nodeConfigList) => {

  for(let i = 0; i < nodeConfigList.length; i++) {

    const cnjNode = nodeConfigList[i].cnj

    if(isNodeFailing(cnjNode)) {

      cnjNode.score = 0

    } else if(isNodeStarting(cnjNode)) {

      cnjNode.score = 10

    } else {

      cnjNode.score = calculateScoreFromBlocks(cnjNode)

      // TODO: Also take connections into account
      // TODO: Create a cnjNode score object with all information about what reduces the score.
      // TODO: Call score > 'health'
      // TODO: save the cnjNode object as json file alongside the stats.json
    }
  }
}

const printNodes = (nodeConfigList) => {

  for(let i = 0; i < nodeConfigList.length; i++) {

    const cnjNode = nodeConfigList[i].cnj

    const name                = cnjNode.name
    const nodeBlocks          = cnjNode.receivedBlocks
    const globalBlockHeights  = getLastBlockHeights(200, null)
    const nodeBlockHeights    = getLastBlockHeights(200, nodeBlocks)

    let blocks = ''

    for(let i = 0; i < globalBlockHeights.length; i++) {

      const blockHeight = globalBlockHeights[i]

      if(nodeBlockHeights.includes(blockHeight)) {

        for(let k = 0; k < nodeBlocks.length; k++) {

          const nodeBlock = nodeBlocks[k]

          if(nodeBlock.blockHeight === blockHeight) {

            const diffTime = getTimeDifferenceInSeconds(nodeBlock.receivedBlockTime, nodeBlock.blockTime)

                 if(diffTime < 2) { blocks += ' '.bgGreen }
            else if(diffTime < 4) { blocks += ' '.bgYellow }
            else                  { blocks += ' '.bgRed }

            break
          }
        }

      } else {

        blocks += ' '.bgBlack
      }
    }

    let score = cnjNode.score + ''

         if(cnjNode.score <  10) { score = '  ' + score }
    else if(cnjNode.score < 100) { score =  ' ' + score }

         if(cnjNode.score < 50) { score = score.red }
    else if(cnjNode.score < 80) { score = score.yellow }
    else                        { score = score.green }

    let leader = ''

    if(cnjNode.isLeader) {

      leader = ' LEADER! '.black.bgGreen

    } else {

      leader = ' PASSIVE '.black.bgWhite
    }

    if(isInEpochChangeRange()) {

      leader = ' LEADER! '.white.bgBlue
    }

    console.log(
      name,
      cnjNode.state,
      cnjNode.blockHeight,
      leader,
      score,
      blocks
    )
  }
}

const restartNodeBasedOnScore = (nodeConfigList) => {

  nodeConfigList.forEach(nodeConfig => {

    const cnjNode = nodeConfig.cnj

    if(isNodeRunning(cnjNode)) {

      if(cnjNode.score < 5) {

        restartNode(nodeConfig, true)
      }
    }
  })
}

const prepareCardanoNodeConfigs = (config, nodeConfigTemplate) => {

  const numNodes          = config.num_nodes
  const usePreferredList  = config.use_preferred_list
  const addToTrustedPeers = config.add_to_trusted_peers

  nodeConfigTemplate      = JSON.stringify(nodeConfigTemplate)

  if(numNodes < 0 || numNodes > 8) {

    throw 'config.num_nodes range: 1 to 8, yours: ' + numNodes
  }

  let nodeConfigs = []

  for(let i = 0; i < numNodes; i++) {

    let nc = nodeConfigTemplate

    nc = nc.split('###node-index###').join(i)
    nc = nc.split('###ip-public###').join(config.ip_public)
    nc = nc.split('###ip-listen###').join(config.ip_listen)
    nc = nc.split('###ip-rest###').join(config.ip_rest)
    nc = nc.split('###port-listen###').join(config.port_listen)
    nc = nc.split('###port-rest###').join(config.port_rest)
    nc = nc.split('###id-public###').join(config.id_public)
    nc = nc.split('"###max-connections###"').join(config.max_connections)
    nc = nc.split('"###max-inbound-connections###"').join(config.max_inbound_connections)
    nc = nc.split('###gossip-interval###').join(config.gossip_interval)

    nodeConfigs.push(JSON.parse(nc))
  }

  for(let i = 0; i < nodeConfigs.length; i++) {

    const nodeConfig = nodeConfigs[i]

    for(let k = 0; k < nodeConfigs.length && usePreferredList; k++) {

      if(k === i) {

        continue
      }

      nodeConfig.p2p.layers.preferred_list.peers.push({
        address:  nodeConfigs[k].p2p.listen_address,
        id:       nodeConfigs[k].p2p.public_id,
      })
    }

    for(let k = nodeConfigs.length - 1; k >= 0 && addToTrustedPeers; k--) {

      if(k === i) {

        continue
      }

      nodeConfig.p2p.trusted_peers.unshift({
        address:  nodeConfigs[k].p2p.listen_address,
        id:       nodeConfigs[k].p2p.public_id,
      })
    }

    writeTextFile('./configs/nodeconfig_' + i + '.yaml', JSON.stringify(nodeConfigs[i], null, 2))

    // Additional properties, which are not part of the node config itself,
    // but rather handle the node state in this app.

    nodeConfig.cnj = {}

    prepareNode(nodeConfig.cnj, i,
      config.name_prefix, config.genesis_block, config.poolsecret_yaml,
      config.pool_id, config.pooltool_user_id)
  }

  return nodeConfigs
}

const isInEpochChangeRange = () => {

  if(_eposhStartTime !== null && _currentTime !== null) {

    const diffTime = getTimeDifferenceInSeconds(_eposhStartTime, _currentTime)

    return Math.abs(diffTime) < 120 // Set all nodes to be leader for 2 minutes before and after the epoch change.
  }

  return false
}

let _cnjMainLoopId = -1

const cnjMainLoop = async (nodeConfigList) => {

  clearTimeout(_cnjMainLoopId)

  await setNodeStates(nodeConfigList, await pullNodeStats(nodeConfigList))
  setNodeScores(nodeConfigList)

  restartNodeBasedOnScore(nodeConfigList)

  _currentTime = new Date(new Date().getTime() % 86400000)

  if(isInEpochChangeRange()) {

    promoteAllNodesToLeaders(nodeConfigList) // Promote all nodes to leaders while epoch is incrementing.

  } else {

    chooseLeaderBasedOnScore(nodeConfigList)
  }

  console.clear()
  console.log('### cardano-node-juggler: v' + version + ' ###')
  console.log('')
  console.log('node name    state   height  pas/lead +++ blocks - time since last block: ' + getTimeDifferenceInSeconds(new Date(), getLastBlock().receivedBlockTime).toFixed(1) + 's')
  console.log('                                          1   5   10   15   20   25   30   35   40   45   50   55   60   65   70   75   80   85   90   95  100  105  110  115  120  125  130  135  140  145  150  155  160  165  170  175  180  185  190  195  200')

  printNodes(nodeConfigList)

  console.log('')

  if(_eposhStartTime && _currentTime) {

    console.log('epoch switch at:', _formatTime(_eposhStartTime), _formatTime(_currentTime),  getTimeDifferenceInSeconds(_eposhStartTime, _currentTime))
  }

  _cnjMainLoopId = setTimeout(cnjMainLoop, 500, nodeConfigList)
}

const _formatTime = (date) => {

  const options = {
    // year: 'numeric', month:  'numeric', day:    'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false, timeZone: 'UTC'
  };

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

module.exports = { cnjMainLoop, prepareCardanoNodeConfigs }
