const colors                          = require('colors');

const { version }                     = require('../../package.json')

const { getDuration }                 = require('./timer.utils.js')

const { getHighestBlockHeight }       = require('./node.utils.js')
const { getLatestBlock }              = require('./node.utils.js')
const { isCNJNodeInEpochTransition }  = require('./node.utils.js')

const { getLastSuccessfulResponse }   = require('./pooltool.utils.js')

const { isCNJNodeFailing }            = require('../CNJNodeState.js')
const { cnjNodeList }                 = require('../CNJNode.js')

let _currentTime    = null
let _epochStartTime = null

const printScreen = () => {

  // TODO: check async behavior. Some jcli commands may take longer and should be awaited before setting a new timeout.

  // TODO: Detailed score object!!

  // TODO: Look into not restarting, but reporting to email or sms when a node does not receive blocks anymore. (more supervision by operator)
  // TODO: Add node restart list (maybe 5 to 10 entries). This needs a log file for restarts.

  // TODO: Get and display leader logs, also log them in json files

  _currentTime      = new Date(new Date().getTime() % 86400000)

  const numBlocks   = process.stdout.columns > 51 ? process.stdout.columns - 48 : 0
  const latestBlock = getLatestBlock()
  let blockNums     = '1   5   10   15   20   25   30   35   40   45   50   55   60   65   70   75   80   85   90   95  100  105  110  115  120  125  130  135  140  145  150  155  160  165  170  175  180  185  190  195  200'

  blockNums = assureLength(blockNums, numBlocks)

  console.clear()

  console.log('### cardano-node-juggler: v' + version + ' ###')
  console.log('')
  console.log('node         state       height  leader?  +++' + (numBlocks > 0 ? ' blocks' : ''))
  console.log('                                             ' + (numBlocks > 0 ? ' ' + blockNums : ''))

  printNodes(numBlocks)

  console.log('')
  console.log('last block received: ' + (latestBlock ? getDuration(new Date(), latestBlock.receivedBlockTime).toFixed(1) + 's ago' : ''))

  if(_epochStartTime && _currentTime) {

    console.log('epoch switch at:    ', formatTime(_epochStartTime), formatTime(_currentTime),  getDuration(_epochStartTime, _currentTime))
  }

  console.log('PoolTool: ', getLastSuccessfulResponse())
}

const printNodes = (numBlocks) => {

  const blockHeightMax = getHighestBlockHeight()

  for(let i = 0; i < cnjNodeList.length; i++) {

    const cnjNode     = cnjNodeList[i]

    _epochStartTime   = _epochStartTime || cnjNode.epochStartTime

    let name          = assureLength(cnjNode.name,             12, false)
    let state         = assureLength(cnjNode.state,             8, false)
    let blockHeight   = assureLength(cnjNode.blockHeight + '',  9, true)
    let score         = assureLength(cnjNode.score.total + '',  3, true)
    let leader        = isCNJNodeFailing(cnjNode) ? '         '.black.bgBlack : (cnjNode.isLeader ? ' LEADER! ' : ' PASSIVE '.black.bgWhite)
    let blocks        = ''

         if(cnjNode.score < 50) { score = score.red }
    else if(cnjNode.score < 80) { score = score.yellow }
    else                        { score = score.green }

    if(cnjNode.isLeader) {

      if(isCNJNodeInEpochTransition(cnjNode)) {

        leader = leader.white.bgBlue

      } else {

        leader = leader.black.bgGreen
      }
    }

    for(let i = 0, blockHeight = blockHeightMax; i < numBlocks; i++, blockHeight--) {

      const block = cnjNode.getBlockByBlockHeight(blockHeight)

      if(block) {

        const receivedBlockTimeDelay = getDuration(block.receivedBlockTime, block.blockTime)

             if(receivedBlockTimeDelay < 2) { blocks += ' '.bgGreen }
        else if(receivedBlockTimeDelay < 4) { blocks += ' '.bgYellow }
        else                                { blocks += ' '.bgRed }

      } else {

        blocks += ' '.bgBlack
      }
    }

    console.log(
      name,
      state,
      blockHeight,
      leader,
      score,
      blocks
    )
  }
}

const assureLength = (str, length, putRight) => {

  if(!length) length = 1 // TODO: check
  if(!str) str = ''

  if(str.length > length) {

    if(!putRight) {

      return str.substr(0, length)
    }

    return str.substr(str.length - length, length)
  }

  if(!putRight) {

    while(str.length < length) str = str + ' '

  }else {

    while(str.length < length) str = ' ' + str
  }

  return str
}

const formatTime = (date) => {

  const options = { timeZone: 'UTC', hour12: false,
    hour: 'numeric', minute: 'numeric', second: 'numeric', // year: 'numeric', month: 'numeric', day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-US', options).format(date)
}

module.exports = {

  printScreen
}
