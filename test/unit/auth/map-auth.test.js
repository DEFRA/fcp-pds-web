const mapAuth = require('../../../app/auth/map-auth')
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
} = require('../../../app/auth/permissions')

const buildRequest = (isAuthenticated, scope = []) => ({
  auth: {
    isAuthenticated,
    credentials: { scope }
  }
})

describe('mapAuth', () => {
  test('returns anonymous flags for unauthenticated requests', () => {
    const result = mapAuth(buildRequest(false))

    expect(result.isAuthenticated).toBe(false)
    expect(result.isAnonymous).toBe(true)
    expect(result.isApplicationAdmin).toBe(false)
    expect(result.isReportViewerUser).toBe(false)
    expect(result.isEventViewerUser).toBe(false)
    expect(result.isHoldViewerUser).toBe(false)
    expect(result.isInjectionViewerUser).toBe(false)
    expect(result.isClosureViewerUser).toBe(false)
    expect(result.isAlertViewerUser).toBe(false)
    expect(result.isStatementViewerUser).toBe(false)
    expect(result.isMetricsViewerUser).toBe(false)
    expect(result.isResetViewerUser).toBe(false)
    expect(result.isSequenceViewerUser).toBe(false)
    expect(result.isDebtDataViewerUser).toBe(false)
    expect(result.isLedgerViewerUser).toBe(false)
  })

  test('returns admin flag for application admin scope', () => {
    const result = mapAuth(buildRequest(true, [applicationAdmin]))

    expect(result.isAuthenticated).toBe(true)
    expect(result.isAnonymous).toBe(false)
    expect(result.isApplicationAdmin).toBe(true)
    expect(result.isReportViewerUser).toBe(false)
    expect(result.isEventViewerUser).toBe(false)
    expect(result.isHoldViewerUser).toBe(false)
    expect(result.isInjectionViewerUser).toBe(false)
    expect(result.isClosureViewerUser).toBe(false)
    expect(result.isAlertViewerUser).toBe(false)
    expect(result.isStatementViewerUser).toBe(false)
    expect(result.isMetricsViewerUser).toBe(false)
    expect(result.isResetViewerUser).toBe(false)
    expect(result.isSequenceViewerUser).toBe(false)
    expect(result.isDebtDataViewerUser).toBe(false)
    expect(result.isLedgerViewerUser).toBe(false)
  })

  test('returns viewer flags for all configured permissions', () => {
    const result = mapAuth(buildRequest(true, [
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
    ]))

    expect(result.isAuthenticated).toBe(true)
    expect(result.isAnonymous).toBe(false)
    expect(result.isApplicationAdmin).toBe(false)
    expect(result.isReportViewerUser).toBe(true)
    expect(result.isEventViewerUser).toBe(true)
    expect(result.isHoldViewerUser).toBe(true)
    expect(result.isInjectionViewerUser).toBe(true)
    expect(result.isClosureViewerUser).toBe(true)
    expect(result.isAlertViewerUser).toBe(true)
    expect(result.isStatementViewerUser).toBe(true)
    expect(result.isMetricsViewerUser).toBe(true)
    expect(result.isResetViewerUser).toBe(true)
    expect(result.isSequenceViewerUser).toBe(true)
    expect(result.isDebtDataViewerUser).toBe(true)
    expect(result.isLedgerViewerUser).toBe(true)
  })
})
