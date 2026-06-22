const auth = require('../auth')

module.exports = {
  method: 'GET',
  path: '/logout',
  options: {
    auth: false
  },
  handler: async (request, h) => {
    request.auth?.credentials?.account && await auth.logout(request.auth.credentials.account)
    request.cookieAuth.clear()
    return h.redirect('/login')
  }
}
