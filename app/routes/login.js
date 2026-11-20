const auth = require('../auth')
const { GET } = require('../constants/api-methods')
const { INTERNAL_SERVER_ERROR } = require('../constants/http-status-codes')
const { AUTH_PATHS } = require('../constants/paths')
const { ERROR_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: AUTH_PATHS.LOGIN,
  options: {
    auth: false
  },
  handler: async (_request, h) => {
    try {
      const authUrl = await auth.getAuthenticationUrl()
      return h.redirect(authUrl)
    } catch (err) {
      console.log('Error authenticating', err)
    }
    return h.view(ERROR_VIEWS.INTERNAL_SERVER_ERROR).code(INTERNAL_SERVER_ERROR)
  }
}
