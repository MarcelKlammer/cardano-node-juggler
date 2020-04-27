const querystring                     = require('querystring')
const axios                           = require('axios')

const config                          = require('../../pooltool.config.json')

const poolToolQuota       = 15000
const extraWaitTime       = 100     // give it 100ms extra

let _currentURL           = ''
let _lastCallId           = 0

const data                = {

  lastUpdated:            new Date(),
  blockHeightMax:         0,

  lastReportedBlock:      null,
  lastCallTime:           null,
  lastResponse:           null,
  lastSuccessfulResponse: null,
}

const getPoolToolBlockHeight    = () => data.blockHeightMax
const getLastSuccessfulResponse = () => data.lastSuccessfulResponse

const queuePoolToolCall         = () => {

  clearTimeout(_lastCallId)

  const delay = Math.max(poolToolQuota - (Date.now() - data.lastCallTime), 0) + extraWaitTime

  _lastCallId = setTimeout(() => {

    data.lastCallTime = Date.now()

    axios.get(_currentURL).then(response => {

      data.lastCallTime = Date.now()
      data.lastResponse = response.data

      if(data.lastResponse.success) {

        data.lastUpdated            = new Date()
        data.lastSuccessfulResponse = data.lastResponse
        data.blockHeightMax         = data.lastSuccessfulResponse.pooltoolmax
      }

    }).catch(error => console.log(error))

  }, delay)
}

const sendTipToPoolTool = async (cnjNode, block) => {

  if(!config.user_id || !config.pool_id) { return }

  if(!data.lastReportedBlock || (data.lastReportedBlock.blockHeight < block.blockHeight)) {

    data.lastReportedBlock = block

    _currentURL = config.sharetip + '?' +

      querystring.stringify({
        platform:       'cardano-node-juggler',
        jormver:        cnjNode.stats.version,
        poolid:         config.pool_id,
        userid:         config.user_id,
        genesispref:    cnjNode.genesisBlock,
        mytip:          block.blockHeight,
        lasthash:       block.blockHash,
        lastparent:     block.parentHash,
        lastpool:       block.poolHash,
        lastslot:       block.slot,
        lastepoch:      block.epoch
      })

    queuePoolToolCall()
  }
}

module.exports = {

  sendTipToPoolTool,
  getPoolToolBlockHeight,
  getLastSuccessfulResponse
}
