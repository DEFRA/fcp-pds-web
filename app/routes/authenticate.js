const auth = require('../auth')
const HTTP_STATUS = require('../constants/http-status-codes')
const ERROR_VIEWS = require('../constants/error-views')

module.exports = {
  method: 'GET',
  path: '/authenticate',
  options: {
    auth: { mode: 'try' }
  },
  handler: async (request, h) => {
    try {
      await auth.authenticate(request.query.code, request.cookieAuth)
      return h.redirect('/')
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
