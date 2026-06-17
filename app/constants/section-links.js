const permissions = require('../auth/permissions')

const HOME = { href: '/', text: 'Home' }

const PAYMENT_MANAGEMENT_LINKS = [
  { href: '/payment-management/', text: 'Payment Management', homeAuth: [permissions.applicationAdmin] }
]

const REQUEST_EDITOR_LINKS = [
  { href: '/request-editor', text: 'Request Editor', homeAuth: [permissions.applicationAdmin] }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' },
]

module.exports = {
  HOME,
  PAYMENT_MANAGEMENT_LINKS,
  REQUEST_EDITOR_LINKS,
  HELP_LINKS
}
