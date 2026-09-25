const isInRole = require('../../../app/auth/is-in-role')

describe('isInRole', () => {
  test('returns true when role is in credentials scope', () => {
    const credentials = { scope: ['Web.Pds.Admin', 'Payment.Hold.Admin'] }
    expect(isInRole(credentials, 'Web.Pds.Admin')).toBe(true)
  })

  test('returns false when role is not in credentials scope', () => {
    const credentials = { scope: ['Payment.Hold.Admin'] }
    expect(isInRole(credentials, 'Web.Pds.Admin')).toBe(false)
  })

  test('returns false when credentials has no scope', () => {
    expect(isInRole({}, 'Web.Pds.Admin')).toBe(false)
  })

  test('returns false when credentials is null', () => {
    expect(isInRole(null, 'Web.Pds.Admin')).toBe(false)
  })

  test('returns false when credentials is undefined', () => {
    expect(isInRole(undefined, 'Web.Pds.Admin')).toBe(false)
  })
})
