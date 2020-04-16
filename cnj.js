const { cnjMainLoop }                 = require('./cnj.main.js')
const { prepareCardanoNodeConfigs }   = require('./cnj.main.js')

cnjMainLoop(
  prepareCardanoNodeConfigs(
    require('./cnj.config.json'),
    require('./configs/nodeconfig.template.json')))
