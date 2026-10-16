const logging = require('./logging')
const inert = require('./inert')
const auth = require('./auth')
const error = require('./error')
const vision = require('./vision')
const viewContext = require('./view-context')
const router = require('./router')
const cookies = require('./cookies')
const crumb = require('./crumb')

async function registerPlugins (server) {
  const plugins = [
    logging,
    inert,
    auth,
    error,
    vision,
    viewContext,
    router,
    cookies,
    crumb
  ]

  await server.register(plugins)
}

module.exports = { registerPlugins }
