const isInRole = require('./is-in-role')
const {
  applicationAdmin,
  reportViewer,
  eventViewer,
  holdViewer,
  injectionViewer,
  closureViewer,
  alertViewer,
  statementViewer,
  metricsViewer,
  resetViewer,
  sequenceViewer,
  debtDataViewer,
  ledgerViewer
} = require('./permissions')

const mapAuth = (request) => {
  return {
    isAuthenticated: request.auth.isAuthenticated,
    isAnonymous: !request.auth.isAuthenticated,
    isApplicationAdmin: request.auth.isAuthenticated && isInRole(request.auth.credentials, applicationAdmin),
    isReportViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, reportViewer),
    isEventViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, eventViewer),
    isHoldViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, holdViewer),
    isInjectionViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, injectionViewer),
    isClosureViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, closureViewer),
    isAlertViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, alertViewer),
    isStatementViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, statementViewer),
    isMetricsViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, metricsViewer),
    isResetViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, resetViewer),
    isSequenceViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, sequenceViewer),
    isDebtDataViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, debtDataViewer),
    isLedgerViewerUser: request.auth.isAuthenticated && isInRole(request.auth.credentials, ledgerViewer)
  }
}

module.exports = mapAuth
