const auth = require('../auth')
const { GET } = require('../constants/api-methods')
const { AUTH_PATHS } = require('../constants/paths')

module.exports = {
  method: GET,
  path: AUTH_PATHS.LOGOUT,
  options: {
    auth: false
  },
  handler: async (request, h) => {
    request.auth?.credentials?.account && await auth.logout(request.auth.credentials.account)
    request.cookieAuth.clear()
    return h.redirect(AUTH_PATHS.LOGIN)
  }
}
