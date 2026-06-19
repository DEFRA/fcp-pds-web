module.exports = {
  method: 'GET',
  path: '/accessibility',
  options: {
    auth: false,
    handler: (_request, h) => {
      return h.view('accessibility')
    }
  }
}
