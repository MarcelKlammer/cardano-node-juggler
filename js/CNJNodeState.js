const { getDuration }                 = require('./utils/timer.utils.js')

const { isCardanoNodeFailing }        = require('./CardanoNodeState.js')
const { isCardanoNodeStarting }       = require('./CardanoNodeState.js')
const { isCardanoNodeRunning }        = require('./CardanoNodeState.js')

const CNJNodeState = {

  Uninitialized:        'Uninitialized',
  Failing:              'Failing',

  Starting:             'Starting',

  Running:              'Running'
}

const isCNJNodeFailing  = (cnjNode) => cnjNode.state === CNJNodeState.Failing
const isCNJNodeStarting = (cnjNode) => cnjNode.state === CNJNodeState.Starting
const isCNJNodeRunning  = (cnjNode) => cnjNode.state === CNJNodeState.Running

const setCNJNodeFailing = (cnjNode) => {

  if(!isCNJNodeFailing(cnjNode)) {

    cnjNode.setState(CNJNodeState.Failing)

    return true
  }

  return false
}

const setCNJNodeStarting = (cnjNode) => {

  if(!isCNJNodeStarting(cnjNode)) {

    cnjNode.setState(CNJNodeState.Starting)
    cnjNode.reset()

    return true
  }

  return false
}

const setCNJNodeRunning  = (cnjNode) => {

  if(!isCNJNodeRunning(cnjNode)) {

    cnjNode.setState(CNJNodeState.Running)

    return true
  }

  return false
}

const getCNJStateDuration = (cnjNode) => getDuration(new Date(), cnjNode.stateDate)

const setCNJNodeStateByStats = (cnjNode) => {

  if(isCardanoNodeStarting(cnjNode.stats.state)) {

    if(isCNJNodeStarting(cnjNode)) {

      if(getCNJStateDuration(cnjNode) > 300.0) { setCNJNodeFailing(cnjNode) }       // TODO: Put restart threshold into config.

    } else {

      setCNJNodeStarting(cnjNode)
    }

  } else if(isCardanoNodeFailing(cnjNode.stats.state)) {

    if(isCNJNodeStarting(cnjNode)) {

      if(getCNJStateDuration(cnjNode) > 60.0) { setCNJNodeFailing(cnjNode) }

    } else {

      setCNJNodeFailing(cnjNode)
    }

  } else if(isCardanoNodeRunning(cnjNode.stats.state)) {

    setCNJNodeRunning(cnjNode)
  }
}

module.exports = {

  CNJNodeState,

  isCNJNodeFailing,
  isCNJNodeStarting,
  isCNJNodeRunning,

  getCNJStateDuration,

  setCNJNodeFailing,
  setCNJNodeStarting,
  setCNJNodeRunning,

  setCNJNodeStateByStats
}
