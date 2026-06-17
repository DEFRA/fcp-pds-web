const HapiPino = require('hapi-pino')

const logging = {
  plugin: HapiPino,
  options: {
    logPayload: true,
    level: 'warn'
  }
}

module.exports = logging
