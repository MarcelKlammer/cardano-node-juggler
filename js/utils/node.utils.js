const { appendJsonFile }              = require('./file.utils.js')

const { getDuration }                 = require('./timer.utils.js')

const { getBlock }                    = require('./api.utils.js')

const { restartCardanoNode }          = require('./cardano.node.utils.js')

const { sendTipToPoolTool }           = require('./pooltool.utils.js')
const { getPoolToolBlockHeight }      = require('./pooltool.utils.js')

const { isCNJNodeFailing }            = require('../CNJNodeState.js')
const { isCNJNodeStarting }           = require('../CNJNodeState.js')
const { isCNJNodeRunning }            = require('../CNJNodeState.js')

const { setCNJNodeStarting }          = require('../CNJNodeState.js')
const { getCNJStateDuration }         = require('../CNJNodeState.js')
const { setCNJNodeStateByStats }      = require('../CNJNodeState.js')

const { createCNJBlock }              = require('../CNJBlock.js')

const { cnjNodeList }                 = require('../CNJNode.js')

let cardanoNodeStarting = false

const updateAllCNJNodeStates = () => {

  for(let cnjNode of cnjNodeList) { setCNJNodeStateByStats(cnjNode) }

  cardanoNodeStarting = false

  for(let cnjNode of cnjNodeList) {

    cardanoNodeStarting = cardanoNodeStarting || (isCNJNodeStarting(cnjNode) && getCNJStateDuration(cnjNode) < 120.0)
  }

  for(let cnjNode of cnjNodeList) {

    if(isCNJNodeFailing(cnjNode) && !cardanoNodeStarting) {

      cardanoNodeStarting = true

      setCNJNodeStarting(cnjNode)
      restartCardanoNode(cnjNode)
    }
  }
}

const updateAllCNJNodeBlocks = async () => {

  for(let cnjNode of cnjNodeList) {

    if(isCNJNodeRunning(cnjNode)) {

      const block     = createCNJBlock(cnjNode.stats)
      const blockList = cnjNode.receivedBlocks

      if(blockList.length === 0 || (block.blockHeight > blockList[0].blockHeight)) {

        const blockContent = await getBlock(cnjNode.nodeConfig.rest.listen, block.blockHash)

        if(blockContent) {

          cnjNode.addBlock(block)

          const blockData = blockContent.data.toString('hex')

          block.parentHash =        blockData.substr(104, 64)
          block.poolHash   =        blockData.substr(168, 64)
          block.epoch      = '0x' + blockData.substr(16, 8)
          block.slot       = '0x' + blockData.substr(24, 8)

          sendTipToPoolTool(cnjNode, block)

          appendJsonFile('./blocks/blocks-' + block.blockDate.split('.')[0] +
            '-' + cnjNode.index + '.json', JSON.stringify(block) + '\n')
        }
      }
    }
  }
}

const updateAllCNJNodeScores = async () => {

  const blockHeightMax = getHighestBlockHeight()

  for(let cnjNode of cnjNodeList) {

    if(isCNJNodeFailing(cnjNode)) {

      cnjNode.score.blocksMissed          = 0
      cnjNode.score.blockDelays.length    = 0
      cnjNode.score.total                 = 0

    } else if(isCNJNodeStarting(cnjNode)) {

      cnjNode.score.blocksMissed          = 0
      cnjNode.score.blockDelays.length    = 0
      cnjNode.score.total                 = 10

    } else { // running

      const blockList                     = cnjNode.receivedBlocks

      // const maxPenaltyPerBlock            = 2
      // const latestBlock                   = getLatestBlock()

      if(blockHeightMax === 0 || blockList.length <= 5) {

        cnjNode.score.blocksMissed        = 0
        cnjNode.score.blockDelays.length  = 0
        cnjNode.score.total               = 75

      } else {

        const lastNodeBlock               = blockList[0]

        cnjNode.score.blocksMissed        = blockHeightMax - lastNodeBlock.blockHeight




        // // The total score will only ever go below 5 (restarting condition), if for 8 minutes no new block was retrieved.
        // // The other factors, eg. blocksMissed and blockDelays, will only determine the leader choice score.
        //
        // const numLastBlocks               = 50
        //
        // cnjNode.score.blocksMissed        = 0
        // cnjNode.score.blockDelays.length  = 0
        //
        // for(let i = 0, blockHeight = blockHeightMax; i < numLastBlocks; i++, blockHeight--) {
        //
        //   let foundBlockHeight = false
        //
        //   for(let k = 0; k < blockList.length && k < numLastBlocks && !foundBlockHeight; k++) {
        //
        //     foundBlockHeight = blockList[k].blockHeight === blockHeight
        //   }
        //
        //   if(!foundBlockHeight) {
        //
        //     cnjNode.score.blocksMissed++
        //   }
        // }
        //
        for(let i = 0; i < blockList.length && i < numLastBlocks; i++) {

          cnjNode.score.blockDelays.push(
            Math.max(getDuration(blockList[i].receivedBlockTime, blockList[i].blockTime), 0))
        }

        cnjNode.score.blocksDelay         = cnjNode.score.blockDelays.reduce((acc, cur) => acc + Math.min(cur, 5))
        // cnjNode.score.timeSinceLastBlock  = getDuration(new Date() - blockList[0].receivedBlockTime)

        cnjNode.score.total               = Math.floor(100 -
          (cnjNode.score.blocksMissed * 3) - // 34 * -3 = -102
          cnjNode.score.blocksDelay)
          // Math.max(cnjNode.score.timeSinceLastBlock - 430, 0)) // 430 + 5 * 10 = 480 = 8min

        // TODO: Also take connections into account
        // TODO: save the cnjNode object as json file alongside the stats.json
      }
    }
  }
}

const restartCNJNodeByScore = (force) => {

  // Restarting the node is quite relaxed, since a node can 'self heal'
  // by having / getting well connected peers.

  // The main factor is cnjNode.score.timeSinceLastBlock. If for 8 minutes no
  // new block was retrieved, the a cardano node will restart.

  for(let cnjNode of cnjNodeList) {

    if(!cardanoNodeStarting && (force || cnjNode.score.total < 5)) {

      setCNJNodeStarting(cnjNode)
      restartCardanoNode(cnjNode)
    }
  }
}

const getHighestBlockHeight = () => {

  let blockHeightMax = getPoolToolBlockHeight()

  for(let cnjNode of cnjNodeList) {

    if(cnjNode.blockHeight > blockHeightMax) {

      blockHeightMax = cnjNode.blockHeight
    }
  }

  return blockHeightMax
}

const getLatestBlock = () => {

  let latestBlock = null

  for(let cnjNode of cnjNodeList) {

    if(latestBlock === null || (latestBlock && cnjNode.receivedBlocks[0] && getDuration(cnjNode.receivedBlocks[0].receivedBlockTime, latestBlock.receivedBlockTime) > 0)) {

      latestBlock = cnjNode.receivedBlocks[0]
    }
  }

  return latestBlock
}

const isCNJNodeInEpochTransition = (cnjNode) => {

  if(cnjNode.epochStartTime !== null) {

    const diffTime = getDuration(cnjNode.epochStartTime, new Date(new Date().getTime() % 86400000))

    return (diffTime > cnjNode.epochTransitionRange[0] && diffTime < cnjNode.epochTransitionRange[1])
  }

  return false
}

module.exports = {

  updateAllCNJNodeStates,
  updateAllCNJNodeBlocks,
  updateAllCNJNodeScores,

  restartCNJNodeByScore,

  getHighestBlockHeight,
  getLatestBlock,

  isCNJNodeInEpochTransition
}
