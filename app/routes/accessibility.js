const { GET } = require('../constants/api-methods')
const { ACCESSIBILITY_PATHS } = require('../constants/paths')
const { ACCESSIBILITY_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: ACCESSIBILITY_PATHS.ACCESSIBILITY,
  options: {
    auth: false,
    handler: (_request, h) => {
      return h.view(ACCESSIBILITY_VIEWS.ACCESSIBILITY)
    }
  }
}
