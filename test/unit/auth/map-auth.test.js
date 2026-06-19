const mapAuth = require('../../../app/auth/map-auth')

const buildRequest = (isAuthenticated, scope = []) => ({
  auth: {
    isAuthenticated,
    credentials: { scope }
  }
})

describe('mapAuth', () => {
  test('returns correct flags for unauthenticated request', () => {
    const result = mapAuth(buildRequest(false))
    expect(result.isAuthenticated).toBe(false)
    expect(result.isAnonymous).toBe(true)
    expect(result.isApplicationAdmin).toBe(false)
  })

  test('returns correct flags for authenticated admin', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Application.Admin']))
    expect(result.isAuthenticated).toBe(true)
    expect(result.isAnonymous).toBe(false)
    expect(result.isApplicationAdmin).toBe(true)
    expect(result.isSchemeAdminUser).toBe(false)
  })

  test('returns correct flags for scheme admin', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Scheme.Admin']))
    expect(result.isSchemeAdminUser).toBe(true)
    expect(result.isApplicationAdmin).toBe(false)
  })

  test('returns correct flags for hold admin', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Hold.Admin']))
    expect(result.isHoldAdminUser).toBe(true)
  })

  test('returns correct flags for data view', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Data.View']))
    expect(result.isDataViewUser).toBe(true)
  })

  test('returns correct flags for status report SFI23', () => {
    const result = mapAuth(buildRequest(true, ['Statements.Status-Reports.SFI-23']))
    expect(result.isStatusReportUser).toBe(true)
  })

  test('returns correct flags for status report delinked', () => {
    const result = mapAuth(buildRequest(true, ['Statements.Status-Reports.Delinked']))
    expect(result.isStatusReportUser).toBe(true)
  })

  test('returns correct flags for manual payments admin', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Manual-Payments.Admin']))
    expect(result.isManualPaymentsUser).toBe(true)
  })

  test('returns correct flags for alert admin', () => {
    const result = mapAuth(buildRequest(true, ['Payment.Alert.Admin']))
    expect(result.isAlertAdminUser).toBe(true)
  })
})
