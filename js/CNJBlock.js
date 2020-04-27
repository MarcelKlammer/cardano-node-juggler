const CNJBlock = function(stats) {

  let receivedBlockTime = new Date(stats.lastReceivedBlockTime)

  if(receivedBlockTime.getTime() === 0) {

    receivedBlockTime = new Date(stats.lastBlockTime)
  }

  this.blockHeight        = parseInt(stats.lastBlockHeight)   // height
  this.blockDate          = stats.lastBlockDate               // slot
  this.blockTime          = new Date(stats.lastBlockTime)
  this.receivedBlockTime  = receivedBlockTime
  this.blockHash          = stats.lastBlockHash
  this.blockContentSize   = parseInt(stats.lastBlockContentSize)
  this.blockTx            = parseInt(stats.lastBlockTx)
  this.blockSum           = parseInt(stats.lastBlockSum)
  this.blockFees          = parseInt(stats.lastBlockFees)

  this.parentHash         = null
  this.poolHash           = null
  this.epoch              = null
  this.slot               = null
}

const createCNJBlock = (stats) => {

  return new CNJBlock(stats)
}

module.exports = {

  createCNJBlock
}
