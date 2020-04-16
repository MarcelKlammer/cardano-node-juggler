const { appendJsonFile }              = require('./fileUtils.js')

const { storeBlock }                  = require('./nodeUtils.js')
const { getTimeDifferenceInSeconds }  = require('./timerUtils.js')

const _globalBlockList                = []

const createBlock = (stats) => {

  let receivedBlockTime = new Date(stats.lastReceivedBlockTime)

  if(receivedBlockTime.getTime() === 0) {

    receivedBlockTime = new Date(stats.lastBlockTime)
  }

  return {
    blockHeight:        parseInt(stats.lastBlockHeight),        // height
    blockDate:          stats.lastBlockDate,                    // slot
    blockTime:          new Date(stats.lastBlockTime),
    receivedBlockTime:  receivedBlockTime,
    blockHash:          stats.lastBlockHash,
    blockContentSize:   parseInt(stats.lastBlockContentSize),
    blockTx:            parseInt(stats.lastBlockTx),
    blockSum:           parseInt(stats.lastBlockSum),
    blockFees:          parseInt(stats.lastBlockFees),
  }
}

const addBlockToGlobalList = (block) => {

  let addedBlock = false

  if(_globalBlockList.length === 0 || (block.blockHeight > _globalBlockList[0].blockHeight)) {

    _globalBlockList.unshift(block)

    storeGlobalBlock(block)

    addedBlock = true

  } else if(block.blockHeight === _globalBlockList[0].blockHeight &&
    (block.receivedBlockTime.getTime() < _globalBlockList[0].receivedBlockTime.getTime())) {

    _globalBlockList.shift()
    _globalBlockList.unshift(block)
  }

  return addedBlock
}

const addBlockToNodeList = (cnjNode, block) => {

  const blockList = cnjNode.receivedBlocks

  if(blockList.length === 0 || (block.blockHeight > blockList[0].blockHeight)) {

    blockList.unshift(block)

    storeBlock(cnjNode, block)
  }
}

const calculateScoreFromBlocks = (cnjNode) => {

  let score = 80 // 80 out of 100 is the base for recently started running nodes.

  if(_globalBlockList.length > 0 && cnjNode.receivedBlocks.length > 3) {

    score             = 100

    const block0      = _globalBlockList[0] // most recent block of all nodes
    const blockList   = cnjNode.receivedBlocks

    score             -= reduceScoreByTimeSinceLastBlock(blockList, new Date())
    score             -= reduceScoreByMissedBlockHeights(blockList)
    score             -= reduceScoreByReceivedBlockDelay(blockList)

    const nodeBlock   = blockList[0]
    const diffHeight  = block0.blockHeight - nodeBlock.blockHeight // difference should be 0

    // With layer 4 connectivity there shouldn't be a difference in block height.
    // The latest block is shared amongst all local cluster nodes.
    // If you turn off layer 4, then this might have an effect.

    score             -= diffHeight * 5

    if(diffHeight === 0) {

        let diffTime  = getTimeDifferenceInSeconds(nodeBlock.receivedBlockTime, block0.receivedBlockTime)

        // Ideally this difference is also 0 and all nodes got the block at the same time.

        if(diffTime >= 10) {

          diffTime    = 10
        }

        score         -= diffTime * 10 // Every second counts :D
    }

    if(score < 0) { score = 0 }
  }

  return score
}

const reduceScoreByTimeSinceLastBlock = (nodeBlocks, currentTime) => {

  let diffScore = 0

  if(nodeBlocks.length > 0) {

    // Give it 120 seconds since last block received until the score will reduce 1 point for every additional second.

    diffScore   = Math.floor((currentTime.getTime() - nodeBlocks[0].receivedBlockTime.getTime()) / 1000) // seconds
    diffScore   = Math.max(diffScore - 120, 0)
  }

  return diffScore
}

const reduceScoreByMissedBlockHeights = (nodeBlocks) => {

  let diffScore = 0

  // On the ITNv1 we have roughly a block every 20 seconds.
  // So 30 blocks mean roughly 10 minutes time.
  // A missed block within the last 10 minutes reduces the score
  // of the node by 10, eg. missing 10 blocks means reduces the
  // overall score from 100 to 0.

  for(let i = 1; i < nodeBlocks.length && i < 10 && diffScore < 100; i++) {

    diffScore   += (nodeBlocks[i - 1].blockHeight - nodeBlocks[i].blockHeight - 1) * 8
  }

  return diffScore
}

const reduceScoreByReceivedBlockDelay = (nodeBlocks) => {

  let diffScore = 0

  // In an ideal world a node receives a block instantly.
  // For every second one of the last 30 blocks was received later than its creation time
  // the score is reduces by 1 point, eg. 3 seconds delay on each of the 30 blocks received
  // will reduce the score by 90 in total.

  for(let i = 0; i < nodeBlocks.length && i < 10 && diffScore < 100; i++) {

    diffScore += Math.max(getTimeDifferenceInSeconds(nodeBlocks[i].receivedBlockTime, nodeBlocks[i].blockTime), 0)
  }

  return diffScore
}

const storeGlobalBlock = async (block) => {

  const epoch       = block.blockDate.split('.')[0]
  const logFileName = './blocks/blocks-' + epoch + '-all.json'

  appendJsonFile(logFileName, JSON.stringify(block) + '\n')
}

const getLastBlock = () => {

  return _globalBlockList.length > 0 ? _globalBlockList[0] : {}
}

const getLastBlockHeights = (limit, nodeBlocks) => {

  let blockList   = nodeBlocks ? nodeBlocks : _globalBlockList
  let heightList  = []

  for(let i = 0; i < blockList.length && i < limit; i++) {

    heightList.push(blockList[i].blockHeight)
  }

  return heightList
}

module.exports = {

  createBlock,
  addBlockToGlobalList,
  addBlockToNodeList,
  calculateScoreFromBlocks,
  getLastBlock,
  getLastBlockHeights
}
