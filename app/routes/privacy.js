const { GET } = require('../constants/api-methods')
const { PRIVACY_PATHS } = require('../constants/paths')
const { PRIVACY_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: PRIVACY_PATHS.PRIVACY,
  options: {
    auth: false,
    handler: (_request, h) => {
      return h.view(PRIVACY_VIEWS.PRIVACY)
    }
  }
}
