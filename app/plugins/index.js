const logging = require('./logging')
const inert = require('./inert')
const auth = require('./auth')
const vision = require('./vision')
const viewContext = require('./view-context')
const router = require('./router')

async function registerPlugins (server) {
  const plugins = [
    logging,
    inert,
    auth,
    vision,
    viewContext,
    router
  ]

  await server.register(plugins)
}

module.exports = { registerPlugins }
