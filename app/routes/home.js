const authRoles = require('../auth/permissions')
const { GET } = require('../constants/api-methods')
const { HOME_PATHS } = require('../constants/paths')
const sitemap = require('../constants/sitemap')
const { HOME_VIEWS } = require('../constants/views')

module.exports = {
  method: GET,
  path: HOME_PATHS.HOME,
  options: {
    auth: {
      scope: Object.values(authRoles)
    }
  },
  handler: async (request, h) => {
    const cards = [...sitemap]
    cards.shift()
    cards.pop()
    for (const card of cards) {
      if (Array.isArray(card.links)) {
        card.links = card.links.filter(link => link.homeAuth)
        card.hasAccess = card.links.some(link => {
          return link.homeAuth.some(authFlag => request.auth.credentials.scope.includes(authFlag))
        })
      }
    }

    const accessibleCards = cards.filter(card => card.hasAccess)
    return h.view(HOME_VIEWS.HOME, {
      cards: accessibleCards
    })
  }
}
