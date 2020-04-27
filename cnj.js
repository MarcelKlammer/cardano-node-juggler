const { prepareNodeConfigs }          = require('./js/utils/node.config.utils.js')
const { prepareCNJNodes }             = require('./js/CNJNode')

const { cnjMainLoop }                 = require('./cnj.main.js')

const cnjConfig                       = require('./cnj.config.json')

prepareNodeConfigs(cnjConfig, require('./configs/nodeconfig.template.json'))
prepareCNJNodes(cnjConfig)

cnjMainLoop().catch(error => console.error(error))


