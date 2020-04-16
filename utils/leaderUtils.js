const { isNodeRunning }               = require('./nodeUtils.js')

const { demoteLeader }                = require('./nodeUtils.js')
const { promoteLeader }               = require('./nodeUtils.js')

let _lastLeader                       = null

const chooseLeaderBasedOnScore = async (nodeConfigList) => {

  let bestNode = _lastLeader

  if(bestNode && bestNode.isLeader && isNodeRunning(bestNode) && bestNode.score === 100) {

    // Leader is at max score. No need to change.

    return
  }

  for(let i = 0; i < nodeConfigList.length; i++) {

    const nodeConfig = nodeConfigList[i]
    const cnjNode = nodeConfig.cnj

    if(isNodeRunning(cnjNode)) {

      if(bestNode === null || cnjNode.score > bestNode.score) {

        bestNode = cnjNode
      }
    }
  }

  for(let i = 0; i < nodeConfigList.length; i++) {

    const nodeConfig = nodeConfigList[i]
    const cnjNode = nodeConfig.cnj

    if(isNodeRunning(cnjNode)) {

      if(cnjNode !== bestNode) {

        await demoteLeader(nodeConfig)

      } else {

        await promoteLeader(nodeConfig)
      }
    }
  }

  _lastLeader = bestNode
}

const promoteAllNodesToLeaders = async (nodeConfigList) => {

  for(let i = 0; i < nodeConfigList.length; i++) {

    const nodeConfig = nodeConfigList[i]
    const cnjNode = nodeConfig.cnj

    if(isNodeRunning(cnjNode)) {

      await promoteLeader(nodeConfig)
    }
  }
}

module.exports = {

  chooseLeaderBasedOnScore,
  promoteAllNodesToLeaders
}
