const { writeTextFileAsync }          = require('./file.utils.js')
const { readTextFileAsync }           = require('./file.utils.js')

const { sleep }                       = require('./timer.utils.js')

const { jormungandrStartNode }        = require('./jormungandr.utils.js')

const { getAllNodeStats }             = require('./api.utils.js')
const { getAllLeaders }               = require('./api.utils.js')
const { getAllSettings }              = require('./api.utils.js')

const { getShutdown }                 = require('./api.utils.js')

const { CardanoNodeState }            = require('../CardanoNodeState.js')

const { isCNJNodeRunning }            = require('../CNJNodeState.js')

const { cnjNodeList }                 = require('../CNJNode.js')

const updateAllCardanoNodeStats       = async () => {

  const nodeStatsList = await getAllNodeStats(cnjNodeList)

  for(let i = 0; i < nodeStatsList.length; i++) {

    const stats   = nodeStatsList[i]
    const cnjNode = cnjNodeList[i]

    if(stats) {

      cnjNode.stats = stats.data

    } else {

      cnjNode.stats = { state: CardanoNodeState.Failing }
    }

    const statsName = './stats/stats-' + cnjNode.index + '.json'
    const newStats  = JSON.stringify(cnjNode.stats, null, 2)

    if(await readTextFileAsync(statsName) !== newStats) { // only overwrite file, if changes happened.

      await writeTextFileAsync(statsName, newStats)
    }
  }
}

const updateAllCardanoNodeLeaders     = async () => {

  const leadersList = await getAllLeaders(cnjNodeList)

  for(let i = 0; i < leadersList.length; i++) {

    const leaders = leadersList[i]
    const cnjNode = cnjNodeList[i]

    if(isCNJNodeRunning(cnjNode)) {

      if(leaders) {

        cnjNode.isLeader = leaders.data.length > 0

      } else {

        cnjNode.isLeader = false
      }
    }
  }
}

const updateAllCardanoNodeSettings    = async () => {

  let allSettingsSet = true

  for(let cnjNode of cnjNodeList) { allSettingsSet = allSettingsSet && cnjNode.settings !== null }

  if(!allSettingsSet) {

    const settingsList = await getAllSettings(cnjNodeList)

    for(let i = 0; i < settingsList.length; i++) {

      const settings  = settingsList[i]
      const cnjNode   = cnjNodeList[i]

      if(settings && settings.data) {

        if(!cnjNode.settings && settings.data.block0Time) {

          cnjNode.settings        = settings.data
          cnjNode.epochStartTime  = new Date(new Date(settings.data.block0Time).getTime() % 86400000)
        }
      }
    }
  }
}

const shutdownCardanoNode             = async (cnjNode) => {

  const result = await getShutdown(cnjNode.nodeConfig.rest.listen).catch((error) => { console.log(error) })

  console.log('shutdownCardanoNode?')

  if(result && result.status === 200) {

    console.log('shutdownCardanoNode', result.status)

    // cardano node shutdown successful, sleep for 10 seconds

    await sleep(16000)
  }
}

const restartCardanoNode              = async (cnjNode) => {

  await shutdownCardanoNode(cnjNode) // if shutdown, wait for 10 secs.

  jormungandrStartNode(cnjNode)
}

module.exports = {

  updateAllCardanoNodeStats,
  updateAllCardanoNodeLeaders,
  updateAllCardanoNodeSettings,

  restartCardanoNode,
}
