const { GET } = require('../constants/api-methods')
const { SITEMAP_PATHS } = require('../constants/paths')
const sitemap = require('../constants/sitemap')
const { SITEMAP_VIEWS } = require('../constants/views')
const ViewModel = require('./models/sitemap')

module.exports = {
  method: GET,
  path: SITEMAP_PATHS.SITEMAP,
  options: {
    auth: false,
    handler: (_request, h) => {
      return h.view(SITEMAP_VIEWS.SITEMAP, new ViewModel(sitemap))
    }
  }
}
