const querystring                     = require('querystring')
const axios                           = require('axios')

const { getBlock }                    = require('./nodeUtils.js')

const poolToolQuota = 15000
const extraWaitTime = 100     // give it 100ms extra

let _currentURL     = ''
let _lastCallTime   = 0
let _lastCallId     = 0

const pooltoolData  = {

  lastUpdated:        new Date(),
  pooltoolmax:        0
}

let _lastResponse   = {}

const queuePoolToolCall = async () => {

  clearTimeout(_lastCallId)

  const delay = Math.max(poolToolQuota - (Date.now() - _lastCallTime), 0) + extraWaitTime

  _lastCallId = setTimeout(() => {

    _lastCallTime = Date.now()

    axios.get(_currentURL).then(response => {

      _lastCallTime = Date.now()

      _lastResponse = response.data

      if(response.data.success) {

        pooltoolData.lastUpdated  = new Date()
        pooltoolData.pooltoolmax  = response.data.pooltoolmax
      }

    }).catch(error => console.log(error))

  }, delay)
}

const sendTipToPoolTool = async (nodeConfig, cnjNode, block) => {

  if(!cnjNode.pooltool_user_id || ! cnjNode.pool_id) {

    return
  }

  const pulledBlock     = await getBlock(nodeConfig, block.blockHash)

  _currentURL = 'https://api.pooltool.io/v0/sharemytip?' +

    querystring.stringify({
      platform:       'cardano-node-juggler',
      jormver:        cnjNode.stats.version,
      poolid:         cnjNode.pool_id,
      userid:         cnjNode.pooltool_user_id,
      genesispref:    cnjNode.genesis_block,
      mytip:          block.blockHeight,
      lasthash:       block.blockHash,
      lastpool:       pulledBlock.poolId,
      lastparent:     pulledBlock.parent,
      lastslot:       pulledBlock.slot,
      lastepoch:      pulledBlock.epoch
    })

  queuePoolToolCall()
}

const getLastResponse = () => {

  return _lastResponse
}

module.exports = {

  sendTipToPoolTool,
  pooltoolData,
  getLastResponse
}
