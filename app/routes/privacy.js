module.exports = {
  method: 'GET',
  path: '/privacy',
  options: {
    auth: false,
    handler: (_request, h) => {
      return h.view('privacy')
    }
  }
}
