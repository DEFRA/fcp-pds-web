const { HOME, REQUEST_EDITOR_ENRICH_LINKS, REQUEST_EDITOR_LEDGER_LINKS, REPORTS_LINKS, PAYMENT_EVENTS_LINKS, PAYMENT_HOLDS_LINKS, MANUAL_PAYMENTS_LINKS, AGREEMENT_CLOSURES_LINKS, PAYMENT_ALERTS_LINKS, PAYMENT_ALERTS_BY_RECIPIENT_LINKS, STATEMENTS_LINKS, METRICS_LINKS, RESET_PAYMENT_REQUEST_LINKS, HELP_LINKS, SEQUENCE_LINKS, BATCH_LINKS } = require('./section-links')

module.exports = [
  { title: '', links: [HOME] },
  { title: 'Reports', description: 'Generate and download reports', links: REPORTS_LINKS },
  { title: 'Payment events', description: 'Search and view payment events', links: PAYMENT_EVENTS_LINKS },
  { title: 'Request Editor (CPAT)', description: 'Review and approve payment request calculations', links: REQUEST_EDITOR_LEDGER_LINKS },
  { title: 'Request Editor (Ops)', description: 'Provide payment request debt data', links: REQUEST_EDITOR_ENRICH_LINKS },
  { title: 'Payment holds', description: 'View, add or remove payment holds', links: PAYMENT_HOLDS_LINKS },
  { title: 'Manual payments', description: 'Upload payment files to be manually processed.', links: MANUAL_PAYMENTS_LINKS },
  { title: 'Agreement closures', description: 'Search and update closures, or add new closures individually or in bulk', links: AGREEMENT_CLOSURES_LINKS },
  { title: 'Email alerts', description: 'View, edit and add email alerts by recipient or scheme', links: [...PAYMENT_ALERTS_LINKS, ...PAYMENT_ALERTS_BY_RECIPIENT_LINKS] },
  { title: 'Statements', description: 'Find and download payment statements and statement status reports', links: STATEMENTS_LINKS },
  { title: 'Metrics dashboard', description: 'View payment and document metrics filtered by time period', links: METRICS_LINKS },
  { title: 'Reset payment requests', description: 'Reset the payment request for an individual invoice', links: RESET_PAYMENT_REQUEST_LINKS },
  { title: 'Sequence numbers', description: 'View and update sequence numbers for payment schemes', links: SEQUENCE_LINKS },
  { title: 'Batch generator', description: 'Create sample batch files for payment schemes', links: BATCH_LINKS },
  { title: 'Help', links: HELP_LINKS }
]
