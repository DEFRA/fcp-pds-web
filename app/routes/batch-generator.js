const { applicationAdmin, batchViewer } = require('../auth/permissions')

module.exports = {
  method: 'GET',
  path: '/batch-generator',
  options: {
    auth: {
      scope: [applicationAdmin, batchViewer]
    },
    handler: (_request, h) => {
      return h.view('batch-generator')
    }
  }
}
