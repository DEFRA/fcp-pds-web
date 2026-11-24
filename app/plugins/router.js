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
<<<<<<< HEAD
  require('../routes/dev-auth'),
  require('../routes/accessibility'),
  require('../routes/payment-requests'),
=======
  require('../routes/metrics'),
>>>>>>> origin/main
  require('../routes/privacy'),
  require('../routes/sequence'),
  require('../routes/sitemap'),
  require('../routes/static')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
