const { HOME, PAYMENT_MANAGEMENT_LINKS, REQUEST_EDITOR_LINKS, HELP_LINKS } = require('./section-links')

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Payment Management', description: 'Manage payments and requests', links: PAYMENT_MANAGEMENT_LINKS },
  { title: 'Request Editor', description: 'Edit and manage requests', links: REQUEST_EDITOR_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
