const { writeTextFile }               = require('./file.utils.js')

let nodeConfigList                    = []

const prepareNodeConfigs = (config, nodeConfigTemplate) => {

  const numNodes          = config.num_nodes
  const usePreferredList  = config.use_preferred_list
  const addToTrustedPeers = config.add_to_trusted_peers

  nodeConfigTemplate      = JSON.stringify(nodeConfigTemplate)

  if(numNodes < 0 || numNodes > 8) {

    throw 'config.num_nodes range: 1 to 8, yours: ' + numNodes
  }

  nodeConfigList.length = 0

  for(let i = 0; i < numNodes; i++) {

    let nc = nodeConfigTemplate

    nc = nc.split('###node-index###').join(i)
    nc = nc.split('###ip-public###').join(config.ip_public)
    nc = nc.split('###ip-listen###').join(config.ip_listen)
    nc = nc.split('###ip-rest###').join(config.ip_rest)
    nc = nc.split('###port-listen###').join(config.port_listen)
    nc = nc.split('###port-rest###').join(config.port_rest)
    nc = nc.split('###id-public###').join(config.id_public)
    nc = nc.split('"###max-connections###"').join(config.max_connections)
    nc = nc.split('"###max-inbound-connections###"').join(config.max_inbound_connections)
    nc = nc.split('###gossip-interval###').join(config.gossip_interval)

    nodeConfigList.push(JSON.parse(nc))
  }

  for(let i = 0; i < nodeConfigList.length; i++) {

    const nodeConfig = nodeConfigList[i]

    for(let k = 0; k < nodeConfigList.length && usePreferredList; k++) {

      if(k === i) { continue }

      nodeConfig.p2p.layers.preferred_list.peers.push({
        address:  nodeConfigList[k].p2p.listen_address,
        id:       nodeConfigList[k].p2p.public_id,
      })
    }

    for(let k = nodeConfigList.length - 1; k >= 0 && addToTrustedPeers; k--) {

      if(k === i) { continue }

      nodeConfig.p2p.trusted_peers.unshift({
        address:  nodeConfigList[k].p2p.listen_address,
        id:       nodeConfigList[k].p2p.public_id,
      })
    }

    writeTextFile('./configs/nodeconfig_' + i + '.yaml', JSON.stringify(nodeConfigList[i], null, 2))
  }
}

module.exports = {

  nodeConfigList,
  prepareNodeConfigs
}
