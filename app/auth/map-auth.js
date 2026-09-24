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
  const { isAuthenticated, credentials } = request.auth
  const hasRole = role => isAuthenticated && isInRole(credentials, role)

  return {
    isAuthenticated,
    isAnonymous: !isAuthenticated,
    isApplicationAdmin: hasRole(applicationAdmin),
    isReportViewerUser: hasRole(reportViewer),
    isEventViewerUser: hasRole(eventViewer),
    isHoldViewerUser: hasRole(holdViewer),
    isInjectionViewerUser: hasRole(injectionViewer),
    isClosureViewerUser: hasRole(closureViewer),
    isAlertViewerUser: hasRole(alertViewer),
    isStatementViewerUser: hasRole(statementViewer),
    isMetricsViewerUser: hasRole(metricsViewer),
    isResetViewerUser: hasRole(resetViewer),
    isSequenceViewerUser: hasRole(sequenceViewer),
    isDebtDataViewerUser: hasRole(debtDataViewer),
    isLedgerViewerUser: hasRole(ledgerViewer)
  }
}

module.exports = mapAuth
