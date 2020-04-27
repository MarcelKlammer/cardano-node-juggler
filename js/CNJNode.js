const { CardanoNodeState }            = require('./CardanoNodeState.js')
const { CNJNodeState }                = require('./CNJNodeState.js')

const { nodeConfigList }              = require('./utils/node.config.utils.js')

let cnjNodeList = []

const CNJNode = function(index, nodeConfig, appConfig) {

  this.index              = index
  this.name               = appConfig.name_prefix + index

  this.blockHeight        = -1
  this.state              = CNJNodeState.Uninitialized
  this.stateDate          = new Date()
  this.receivedBlocks     = []

  this.stats              = { state: CardanoNodeState.Uninitialized }
  this.settings           = null
  this.epochStartTime     = null

  this.score              = {

    timeSinceLastBlock:   0,
    blocksMissed:         0,
    blocksDelay:          0, // TODO: Find different name
    blockDelays:          [],
    total:                0
  }

  this.epochTransitionRange = appConfig.epoch_transition_range
  this.nodeConfig         = nodeConfig
  this.genesisBlock       = appConfig.genesis_block
  this.poolsecretJson     = appConfig.poolsecret_json
  this.poolsecretYaml     = appConfig.poolsecret_yaml
  this.isLeader           = this.poolsecretYaml !== null

  this.setState = function(state) {

    this.state            = state
    this.stateDate        = new Date()
  }

  this.reset = function() {

    this.blockHeight              = -1
    this.isLeader                 = this.poolsecretYaml !== null
    this.receivedBlocks.length    = 0

    this.score.total              = 0
    this.score.timeSinceLastBlock = 0
    this.score.blocksMissed       = 0
    this.score.blockDelays.length = 0
    this.score.blocksDelay        = 0
  }

  this.addBlock = function(block) {

    this.blockHeight = block.blockHeight
    this.receivedBlocks.unshift(block)

    if(this.receivedBlocks.length > 4400) {

      this.receivedBlocks.length = 4400 // Truncate live data, as the blocks are stored in a json file.
    }
  }

  this.getBlockByBlockHeight = function(blockHeight) {

    for(let block of this.receivedBlocks) {

      if(block.blockHeight === blockHeight) {

        return block
      }
    }

    return null
  }
}

const prepareCNJNodes = (appConfig) => {

  for(let i = 0; i < nodeConfigList.length; i++) {

    cnjNodeList.push(new CNJNode(i, nodeConfigList[i], appConfig))
  }
}

module.exports = {

  cnjNodeList,
  prepareCNJNodes
}
