const { applicationAdmin } = require('../auth/permissions')

module.exports = {
  method: 'GET',
  path: '/request-editor',
  options: {
    auth: {
      scope: [applicationAdmin]
    }
  },
  handler: (request, h) => {
    return h.redirect('http://localhost:3001')
  }
}
