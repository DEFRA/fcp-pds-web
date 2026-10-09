const authCookie = require('@hapi/cookie')
const config = require('../config')
const auth = require('../auth')

const SESSION_AUTH = 'session-auth'

const validateSession = async (_request, session) => {
  if (session?.account) {
    return { valid: true, credentials: session }
  }
  return { valid: false }
}

const authPlugin = {
  plugin: {
    name: 'auth',
    register: async (server) => {
      await server.register(authCookie)

      server.auth.strategy(SESSION_AUTH, 'cookie', {
        cookie: {
          name: SESSION_AUTH,
          password: config.authConfig.cookie.password,
          path: '/',
          isSecure: config.isProd,
          isSameSite: 'Lax', // Needed for the post authentication redirect
          ttl: config.authConfig.cookie.ttl
        },
        keepAlive: true, // Resets the cookie ttl after each route
        validateFunc: validateSession,
        redirectTo: '/login'
      })

      server.auth.default(SESSION_AUTH)

      server.ext('onPreAuth', async (request, h) => {
        if (request.auth.credentials) {
          await auth.refresh(
            request.auth.credentials.account,
            request.cookieAuth
          )
        }
        return h.continue
      })
    }
  }
}

module.exports = authPlugin
module.exports.validateSession = validateSession
