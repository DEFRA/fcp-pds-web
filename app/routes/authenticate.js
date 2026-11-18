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
      if (request.query.error) {
        console.error('Microsoft Entra authentication failed:', {
          error: request.query.error
        })

        return h
          .view(ERROR_VIEWS.INTERNAL_SERVER_ERROR)
          .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }

      if (!request.query.code) {
        console.error('Authentication callback missing authorization code')

        return h
          .view(ERROR_VIEWS.INTERNAL_SERVER_ERROR)
          .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      }

      await auth.authenticate(request.query.code, request.cookieAuth)

      return h.redirect('/')
    } catch (err) {
      if (err.code === 'NO_PDS_ROLES') {
        return h
          .view(ERROR_VIEWS.NOT_AUTHORIZED)
          .code(HTTP_STATUS.FORBIDDEN)
      }

      console.error('Error authenticating:', {
        name: err?.name,
        errorCode: err?.errorCode,
        errorMessage: err?.errorMessage,
        correlationId: err?.correlationId
      })

      return h
        .view(ERROR_VIEWS.INTERNAL_SERVER_ERROR)
        .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
  }
}
