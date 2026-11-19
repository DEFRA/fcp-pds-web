const auth = require('../auth')
const { GET } = require('../constants/api-methods')
const HTTP_STATUS = require('../constants/http-status-codes')
const { AUTH_PATHS, HOME_PATHS } = require('../constants/paths')
const { ERROR_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: AUTH_PATHS.AUTHENTICATE,
  options: {
    auth: { mode: 'try' }
  },
  handler: async (request, h) => {
    try {
      await auth.authenticate(request.query.code, request.cookieAuth)
      return h.redirect(HOME_PATHS.HOME)
    } catch (err) {
      if (err.code === 'NO_PDS_ROLES') {
        return h
          .view(ERROR_VIEWS.NOT_AUTHORIZED)
          .code(HTTP_STATUS.FORBIDDEN)
      }

      console.error('Error authenticating:', err)

      return h
        .view(ERROR_VIEWS.INTERNAL_SERVER_ERROR)
        .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
  }
}
