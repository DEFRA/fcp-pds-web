const devAuth = require('../../../../app/auth/dev-auth')

describe('dev-auth', () => {
  test('getAuthenticationUrl returns /dev-auth', () => {
    expect(devAuth.getAuthenticationUrl()).toBe('/dev-auth')
  })

  test('authenticate sets cookie with scope and account', async () => {
    const cookieAuth = { set: jest.fn() }
    await devAuth.authenticate(undefined, cookieAuth)
    expect(cookieAuth.set).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: expect.arrayContaining(['Payment.Application.Admin']),
        account: expect.objectContaining({ name: 'Developer' })
      })
    )
  })

  test('refresh sets cookie and returns roles', async () => {
    const cookieAuth = { set: jest.fn() }
    const result = await devAuth.refresh(undefined, cookieAuth)
    expect(cookieAuth.set).toHaveBeenCalled()
    expect(result).toContain('Payment.Application.Admin')
  })

  test('logout updates homeAccountId', async () => {
    const devAccount = require('../../../../app/auth/dev-account')
    const originalId = devAccount.homeAccountId
    await devAuth.logout(devAccount)
    expect(devAccount.homeAccountId).not.toBe(originalId)
  })
})
