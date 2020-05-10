const { readTextFile }                = require('./file.utils.js')

const { isCNJNodeRunning }            = require('../CNJNodeState.js')

const { isCNJNodeInEpochTransition }  = require('./node.utils.js')

const { getLeaders }                  = require('./api.utils.js')
const { postLeaders }                 = require('./api.utils.js')
const { deleteLeaders }               = require('./api.utils.js')

const { cnjNodeList }                 = require('../CNJNode.js')

const chooseAllCNJNodeLeaders = () => {

  return // TODO: no promotion / demotion

  const highScoreCNJNode = getHighScoreCNJNode()

  for(let cnjNode of cnjNodeList) {

    if(!cnjNode.poolsecretJson) continue

    if(isCNJNodeRunning(cnjNode)) {

      if(isCNJNodeInEpochTransition(cnjNode)) {

        promoteLeader(cnjNode)

      } else {

        if(cnjNode === highScoreCNJNode) {

          promoteLeader(cnjNode)

        } else {

          demoteLeader(cnjNode)
        }
      }
    }
  }
}

const promoteLeader = async (cnjNode) => {

  const restURL = cnjNode.nodeConfig.rest.listen

  let leaders = await getLeaders(restURL)

  if(leaders && leaders.data) {

    console.log(cnjNode.nodeConfig.rest.listen, leaders.data)
  }

  if(leaders && leaders.data.length === 0 && cnjNode.poolsecretJson) {

    console.log('promoteLeader', cnjNode.name)

    await postLeaders(restURL, readTextFile(cnjNode.poolsecretJson))

    leaders = await getLeaders(restURL)
  }

  cnjNode.isLeader = leaders && leaders.data.length > 0
}

const demoteLeader = async (cnjNode) => {

  const restURL = cnjNode.nodeConfig.rest.listen

  let leaders = await getLeaders(restURL)

  if(leaders && leaders.data.length > 0) {

    console.log('demoteLeader', cnjNode.name)

    for(let i = 0; i < leaders.data.length; i++) {

      await deleteLeaders(restURL, leaders.data[i])
    }

    leaders = await getLeaders(restURL)
  }

  cnjNode.isLeader = leaders && leaders.data.length > 0
}

const getHighScoreCNJNode = () => {

  let highScoreCNJNode  = null

  for(let cnjNode of cnjNodeList) {

    if(highScoreCNJNode === null || (cnjNode.score.total > highScoreCNJNode.score.total)) {

      highScoreCNJNode  = cnjNode
    }
  }

  return highScoreCNJNode
}

module.exports = {

  chooseAllCNJNodeLeaders
}
