const config = require('../config')

const routes = [].concat(
  require('../routes/accessibility'),
  require('../routes/authenticate'),
  require('../routes/closures'),
  require('../routes/cookies'),
  require('../routes/dev-auth'),
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/home'),
  require('../routes/login'),
  require('../routes/logout'),
  require('../routes/payment-requests'),
  require('../routes/metrics'),
  require('../routes/privacy'),
  require('../routes/sequence'),
  require('../routes/sitemap'),
  require('../routes/static')
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
