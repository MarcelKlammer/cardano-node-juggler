const { execShellCommand }            = require('./processUtils.js')

const JcliState = {

  // custom states, if nothing can be retrieved

  Uninitialized:      'Uninitialized',
  Failing:            'Failing',

  // startup states

  StartingRestServer: 'StartingRestServer',
  PreparingStorage:   'PreparingStorage',
  PreparingBlock0:    'PreparingBlock0',
  Bootstrapping:      'Bootstrapping',
  StartingWorkers:    'StartingWorkers',

  // getting the actual stats.

  Running:            'Running'
}

const isJcliRunning   = (state) => state === JcliState.Running
const isJcliFailing   = (state) => state === JcliState.Failing || state === JcliState.Uninitialized
const isJcliStarting  = (state) => !isJcliRunning(state) && !isJcliFailing(state)

const jcliGetSettings = async (hostRest) => {

  const execResult = await execShellCommand(
    './jcli rest v0 settings get --output-format json --host http://' + hostRest + '/api')

  try { return JSON.parse(execResult) }
  catch(e) { return { state: JcliState.Failing, msg: execResult } }
}

const jcliGetNodeStats = async (hostRest) => {

  const execResult = await execShellCommand(
    './jcli rest v0 node stats get --output-format json --host http://' + hostRest + '/api')

  try { return JSON.parse(execResult) }
  catch(e) { return { state: JcliState.Failing, msg: execResult } }
}

const jcliGetBlock = async (hostRest, blockHash) => {

  const execResult = await execShellCommand(
    './jcli rest v0 block ' + blockHash + ' get --host http://' + hostRest + '/api')

  return {

    poolId:        execResult.substr(168, 64),
    parent:        execResult.substr(104, 64),
    slot:   '0x' + execResult.substr(24, 8),
    epoch:  '0x' + execResult.substr(16, 8)
  }
}

const jcliGetShutdown = async (hostRest) => {

  const execResult = await execShellCommand(
    './jcli rest v0 shutdown get --host http://' + hostRest + '/api')

  console.log(execResult)

  return { shutdown: execResult === 'Success' }
}

const jcliGetLeaders = async (hostRest) => {

  const execResult = await execShellCommand(
    './jcli rest v0 leaders get --output-format json --host http://' + hostRest + '/api')

  //

  try { return JSON.parse(execResult) }
  catch(e) { console.log(hostRest,'jcliGetLeaders', execResult); return [] }
}

const jcliDemoteLeader = async (hostRest, id) => {

  const execResult = await execShellCommand(
    './jcli rest v0 leaders delete ' + id + ' --host http://' + hostRest + '/api')

  // console.log(hostRest,'jcliDemoteLeader', execResult)
}

const jcliPromoteLeader = async (hostRest) => {

  const execResult = await execShellCommand(
    './jcli rest v0 leaders post --file ./poolsecret/poolsecret.yaml --host http://' + hostRest + '/api')

  // console.log(hostRest,'jcliPromoteLeader', execResult)
}

module.exports = {

  JcliState,

  isJcliRunning,
  isJcliFailing,
  isJcliStarting,

  jcliGetSettings,

  jcliGetNodeStats,
  jcliGetBlock,
  jcliGetShutdown,

  jcliGetLeaders,
  jcliDemoteLeader,
  jcliPromoteLeader
}
