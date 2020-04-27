const axios                           = require('axios')

const getNodeStats    = async (restURL) => axios.get('http://' + restURL + '/api/v0/node/stats',  { responseType: 'json' }).catch(() => {})
const getLeaders      = async (restURL) => axios.get('http://' + restURL + '/api/v0/leaders',     { responseType: 'json' }).catch(() => {})
const getShutdown     = async (restURL) => axios.get('http://' + restURL + '/api/v0/shutdown',    { responseType: 'json' }).catch(() => {})
const getSettings     = async (restURL) => axios.get('http://' + restURL + '/api/v0/settings',    { responseType: 'json' }).catch(() => {})
const getBlock        = async (restURL, blockHash) => axios.get('http://' + restURL + '/api/v0/block/' + blockHash, { responseType: 'arraybuffer' }).catch(() => {})
const postLeaders     = async (restURL, secretJsonObj) => axios.post('http://' + restURL + '/api/v0/leaders', { data: secretJsonObj }).catch((error) => { console.log(error) })
const deleteLeaders   = async (restURL, id) => axios.delete('http://' + restURL + '/api/v0/leaders/'+id, { data: id + '' }).catch((error) => { console.log(error) })

const getAllNodeStats = async (cnjNodeList) => {

  const restCalls = []

  for(let cnjNode of cnjNodeList) { restCalls.push(getNodeStats(cnjNode.nodeConfig.rest.listen)) }

  return await Promise.all(restCalls); // resolve all promises
}

const getAllLeaders   = async (cnjNodeList) => {

  const restCalls = []

  for(let cnjNode of cnjNodeList) { restCalls.push(getLeaders(cnjNode.nodeConfig.rest.listen)) }

  return await Promise.all(restCalls); // resolve all promises
}

const getAllSettings  = async (cnjNodeList) => {

  const restCalls = []

  for(let cnjNode of cnjNodeList) { restCalls.push(getSettings(cnjNode.nodeConfig.rest.listen)) }

  return await Promise.all(restCalls); // resolve all promises
}

module.exports = {

  getNodeStats,
  getLeaders,
  getShutdown,
  getSettings,
  getBlock,
  postLeaders,
  deleteLeaders,

  getAllNodeStats,
  getAllLeaders,
  getAllSettings
}
