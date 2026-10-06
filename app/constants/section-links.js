const permissions = require('../auth/permissions')

const HOME = { href: '/', text: 'Home' }

const REPORTS_LINKS = [
  { href: '/download-report-list', text: 'Download reports', homeAuth: [permissions.applicationAdmin, permissions.reportViewer] },
  { href: '/download-report-list/request-editor-report', text: 'Request editor report' },
  { href: '/generate-report-list/generate-payment-request-statuses', text: 'Generate payment request statuses report', homeAuth: [permissions.applicationAdmin, permissions.reportViewer] },
  { href: '/generate-report-list/generate-ap-ar-listing-report', text: 'AP/AR listing report', homeAuth: [permissions.applicationAdmin, permissions.reportViewer] }
]

const GENERATE_REPORTS_LINKS = [
  { href: '/generate-report-list', text: 'Generate / find and download reports', homeAuth: [permissions.applicationAdmin, permissions.reportViewer] },
  { href: '/generate-report-list/find-payment-statement-status-report', text: 'Payment statement status report' },
  { href: '/generate-report-list/generate-ap-ar-listing-report', text: 'AP/AR listing report' },
  { href: '/generate-report-list/generate-payment-request-statuses', text: 'Generate payment request statuses report' }
]

const PAYMENT_EVENTS_LINKS = [
  { href: '/monitoring', text: 'View payment events', homeAuth: [permissions.applicationAdmin, permissions.eventViewer] },
  { href: '/monitoring/schemes', text: 'View payment events by scheme', homeAuth: [permissions.applicationAdmin, permissions.eventViewer] }
]

const REQUEST_EDITOR_ENRICH_LINKS = [
  { href: '/capture-debt', text: 'Create new debt data', homeAuth: [permissions.applicationAdmin, permissions.debtDataViewer] },
  { href: '/capture', text: 'Manage unattached debt data', homeAuth: [permissions.applicationAdmin, permissions.debtDataViewer] },
  { href: '/enrich', text: 'View awaiting reporting data', homeAuth: [permissions.applicationAdmin, permissions.debtDataViewer] }
]

const REQUEST_EDITOR_LEDGER_LINKS = [
  { href: '/manual-ledger', text: 'View awaiting ledger assignment', homeAuth: [permissions.applicationAdmin, permissions.ledgerViewer] },
  { href: '/quality-check', text: 'View ledger assignments to be quality checked', homeAuth: [permissions.applicationAdmin, permissions.ledgerViewer] }
]

const PAYMENT_HOLDS_LINKS = [
  { href: '/payment-holds/manage', text: 'Manage payment holds', homeAuth: [permissions.applicationAdmin, permissions.holdViewer] },
  { href: '/payment-holds/add', text: 'Create a new payment hold', description: 'Create a new hold for a payment' },
  { href: '/payment-holds/search', text: 'Search for a payment hold', description: 'Search, view or remove an existing payment hold' },
  { href: '/payment-holds/bulk-manage', text: 'Manage payment holds in bulk', description: 'Manage multiple payment holds at the same time' },
  { href: '/payment-holds/types', text: 'Manage payment hold types', description: 'Create, edit and remove payment hold types' }
]

const MANUAL_PAYMENTS_LINKS = [
  { href: '/manual-payments', text: 'Upload manual payments', homeAuth: [permissions.applicationAdmin, permissions.injectionViewer] }
]

const AGREEMENT_CLOSURES_LINKS = [
  { href: '/closure/manage', text: 'Manage agreement closures', homeAuth: [permissions.applicationAdmin, permissions.closureViewer] },
  { href: '/closure/search', text: 'Search agreement closures', description: 'Search and update an active agreement closure' },
  { href: '/closure/add', text: 'Create a new agreement closure', description: 'Add a new agreement closure' },
  { href: '/closure/bulk', text: 'Bulk add agreement closures', description: 'Add multiple new agreement closures' }
]

const PAYMENT_ALERTS_LINKS = [
  { href: '/alerts/manage', text: 'Manage email alerts', homeAuth: [permissions.applicationAdmin, permissions.alertViewer] },
  { href: '/alerts/manage-by-scheme', text: 'Manage by scheme', description: 'View, edit and add alert recipients by individual scheme' },
  { href: '/alerts/manage-by-recipient', text: 'Manage by recipient', description: 'View, edit and add alert recipients by email address' }
]

const PAYMENT_ALERTS_BY_RECIPIENT_LINKS = [
  { href: '/alerts/update-by-recipient', text: 'Update recipient alerts', description: 'View and/or update a recipient\'s email alerts' },
  { href: '/alerts/update', text: 'Add new recipient', description: 'Add a new recipient and set email alerts for schemes' },
  { href: '/alerts/remove-by-recipient', text: 'Remove recipient', description: 'Remove a recipient and their email alerts' }
]

const STATEMENTS_LINKS = [
  { href: '/download-statements', text: 'Download payment statements', homeAuth: [permissions.applicationAdmin, permissions.statementViewer] },
  { href: '/status-report', text: 'Download statement status report', homeAuth: [permissions.applicationAdmin, permissions.statementViewer] }
]

const METRICS_LINKS = [
  { href: '/metrics', text: 'View metrics dashboard', homeAuth: [permissions.applicationAdmin, permissions.metricsViewer] }
]

const RESET_PAYMENT_REQUEST_LINKS = [
  { href: '/payment-request/reset', text: 'Reset payment request', homeAuth: [permissions.applicationAdmin, permissions.resetViewer] }
]

const SEQUENCE_LINKS = [
  { href: '/sequence', text: 'View and amend sequence numbers', homeAuth: [permissions.applicationAdmin, permissions.sequenceViewer] }
]

const BATCH_LINKS = [
  { href: '/batch-generator', text: 'Create sample batch files', homeAuth: [permissions.applicationAdmin, permissions.batchViewer] }
]

const HELP_LINKS = [
  { href: '/accessibility', text: 'Accessibility statement' },
  { href: '/cookies', text: 'Cookies' },
  { href: '/privacy', text: 'Privacy' },
]

module.exports = {
  HOME,
  REQUEST_EDITOR_ENRICH_LINKS,
  REQUEST_EDITOR_LEDGER_LINKS,
  REPORTS_LINKS,
  GENERATE_REPORTS_LINKS,
  PAYMENT_EVENTS_LINKS,
  PAYMENT_HOLDS_LINKS,
  MANUAL_PAYMENTS_LINKS,
  AGREEMENT_CLOSURES_LINKS,
  PAYMENT_ALERTS_LINKS,
  PAYMENT_ALERTS_BY_RECIPIENT_LINKS,
  STATEMENTS_LINKS,
  METRICS_LINKS,
  RESET_PAYMENT_REQUEST_LINKS,
  SEQUENCE_LINKS,
  BATCH_LINKS,
  HELP_LINKS
}
