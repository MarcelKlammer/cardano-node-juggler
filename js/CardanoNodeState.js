const CardanoNodeState = {

  // custom states, if nothing can be retrieved

  Uninitialized:            'Uninitialized',
  Failing:                  'Failing',

  // startup states

  StartingRestServer:       'StartingRestServer',
  PreparingStorage:         'PreparingStorage',
  PreparingBlock0:          'PreparingBlock0',
  Bootstrapping:            'Bootstrapping',
  StartingWorkers:          'StartingWorkers',

  // getting the actual stats.

  Running:                  'Running'
}

const isCardanoNodeFailing  = (state) => state === CardanoNodeState.Failing || state === CardanoNodeState.Uninitialized
const isCardanoNodeStarting = (state) => !isCardanoNodeRunning(state) && !isCardanoNodeFailing(state)
const isCardanoNodeRunning  = (state) => state === CardanoNodeState.Running

module.exports = {

  CardanoNodeState,

  isCardanoNodeRunning,
  isCardanoNodeFailing,
  isCardanoNodeStarting
}
