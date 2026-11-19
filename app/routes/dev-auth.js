const auth = require('../auth')
const { GET } = require('../constants/api-methods')
const HTTP_STATUS = require('../constants/http-status-codes')
const { HOME_PATHS, AUTH_PATHS } = require('../constants/paths')
const { ERROR_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: AUTH_PATHS.DEV_AUTH,
  options: {
    auth: false
  },
  handler: async (request, h) => {
    try {
      await auth.authenticate(undefined, request.cookieAuth)
      return h.redirect(HOME_PATHS.HOME)
    } catch (err) {
      console.error('Error authenticating', err)
    }

    return h.view(ERROR_VIEWS.INTERNAL_SERVER_ERROR).code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
