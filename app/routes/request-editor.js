const { applicationAdmin } = require('../auth/permissions')
const AUTH_SCOPE = { scope: [applicationAdmin] }
const config = require('../config')

module.exports = {
  method: 'GET',
  path: '/request-editor',
  options: {
    auth: AUTH_SCOPE
  },
  handler: (_request, h) => {
    const serviceUrl = config.get('requestEditorServiceUrl')
    return h.redirect(serviceUrl)
  }
}
