const { GET } = require('../constants/api-methods')
const { SUCCESS } = require('../constants/http-status-codes')
const { HEALTHCHECK_PATHS } = require('../constants/paths')

module.exports = {
  method: GET,
  path: HEALTHCHECK_PATHS.HEALTHY,
  options: {
    auth: false
  },
  handler: (_request, h) => {
    return h.response('ok').code(SUCCESS)
  }
}
