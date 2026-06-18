const { applicationAdmin } = require('../auth/permissions')
const sitemap = require('../constants/sitemap')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: {
      scope: [applicationAdmin]
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
    return h.view('home', {
      cards: accessibleCards
    })
  }
}
