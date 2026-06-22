const cookie = require('@hapi/cookie')
const config = require('../config')

const authPlugin = {
  plugin: {
    name: 'auth',
    register: async (server) => {
      // Register cookie plugin
      await server.register(cookie)

      // Register the cookie auth strategy
      server.auth.strategy('cookieAuth', 'cookie', {
        cookie: {
          name: 'session',
          password: config.authConfig.cookie.password,
          isSecure: false,
          ttl: config.authConfig.cookie.ttl
        },
        validateFunc: async (_request, session) => {
          // Validate the session
          if (session?.account) {
            return { valid: true, credentials: session }
          }
          return { valid: false }
        }
      })

      // Set cookieAuth as the default strategy
      server.auth.default('cookieAuth')
    }
  }
}

module.exports = authPlugin
