const isInRole = require('../../../app/auth/is-in-role')

describe('isInRole', () => {
  test('returns true when role is in credentials scope', () => {
    const credentials = { scope: ['Payment.Application.Admin', 'Payment.Hold.Admin'] }
    expect(isInRole(credentials, 'Payment.Application.Admin')).toBe(true)
  })

  test('returns false when role is not in credentials scope', () => {
    const credentials = { scope: ['Payment.Hold.Admin'] }
    expect(isInRole(credentials, 'Payment.Application.Admin')).toBe(false)
  })

  test('returns false when credentials has no scope', () => {
    expect(isInRole({}, 'Payment.Application.Admin')).toBe(false)
  })

  test('returns false when credentials is null', () => {
    expect(isInRole(null, 'Payment.Application.Admin')).toBe(false)
  })

  test('returns false when credentials is undefined', () => {
    expect(isInRole(undefined, 'Payment.Application.Admin')).toBe(false)
  })
})
