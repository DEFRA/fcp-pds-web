const config = require('../config')

const routes = [].concat(
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/static'),
  require('../routes/home'),
  require('../routes/authenticate'),
  require('../routes/login'),
  require('../routes/logout'),
  require('../routes/dev-auth'),
  require('../routes/accessibility'),
  require('../routes/privacy'),
  require('../routes/sitemap'),
  require('../routes/cookies'),
  require('../routes/sequence')
)

if (config.batchGeneratorEnabled) {
  routes.push(...require('../routes/batch-generator'))
}

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
