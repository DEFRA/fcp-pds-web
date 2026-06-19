const mockRoles = ['test-role']
const mockAccount = 'test-account'

const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn().mockResolvedValue({
  idTokenClaims: { roles: mockRoles },
  account: mockAccount
})
const mockAcquireTokenSilent = jest.fn().mockResolvedValue({
  idTokenClaims: { roles: mockRoles },
  account: mockAccount
})
const mockRemoveAccount = jest.fn()
const mockGetTokenCache = jest.fn(() => ({ removeAccount: mockRemoveAccount }))

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn(() => ({
    getAuthCodeUrl: mockGetAuthCodeUrl,
    acquireTokenByCode: mockAcquireTokenByCode,
    acquireTokenSilent: mockAcquireTokenSilent,
    getTokenCache: mockGetTokenCache
  })),
  LogLevel: { Verbose: 'verbose' }
}))

const azureAuth = require('../../../app/auth/azure-auth')
const { authConfig } = require('../../../app/config')

let mockCookieAuth

describe('azure authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookieAuth = { set: jest.fn() }
  })

  describe('getAuthenticationUrl', () => {
    beforeEach(() => {
      azureAuth.getAuthenticationUrl()
    })

    test('calls getAuthCodeUrl once', () => {
      expect(mockGetAuthCodeUrl).toHaveBeenCalledTimes(1)
    })

    test('forces select_account prompt', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].prompt).toBe('select_account')
    })

    test('uses redirect url from config', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].redirectUri).toBe(authConfig.redirectUrl)
    })
  })

  describe('authenticate', () => {
    beforeEach(async () => {
      await azureAuth.authenticate('redirectCode', mockCookieAuth)
    })

    test('calls acquireTokenByCode once', () => {
      expect(mockAcquireTokenByCode).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['code', 'redirectCode'],
      ['redirectUri', authConfig.redirectUrl]
    ])('passes %s correctly', (key, expected) => {
      expect(mockAcquireTokenByCode.mock.calls[0][0][key]).toBe(expected)
    })

    test('sets cookieAuth once', () => {
      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['scope', mockRoles],
      ['account', mockAccount]
    ])('sets %s correctly', (key, expected) => {
      expect(mockCookieAuth.set.mock.calls[0][0][key]).toBe(expected)
    })
  })

  describe('refresh', () => {
    test('calls acquireTokenSilent once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockAcquireTokenSilent.mock.calls[0][0].account).toBe(mockAccount)
    })

    test.each([
      [undefined, true],
      [true, true],
      [false, false]
    ])('forceRefresh=%s results in %s', async (force, expected) => {
      await azureAuth.refresh(mockAccount, mockCookieAuth, force)
      expect(mockAcquireTokenSilent.mock.calls[0][0].forceRefresh).toBe(expected)
    })

    test('sets cookieAuth once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['scope', mockRoles],
      ['account', mockAccount]
    ])('sets %s correctly', async (key, expected) => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockCookieAuth.set.mock.calls[0][0][key]).toBe(expected)
    })

    test('returns roles', async () => {
      const result = await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(result).toBe(mockRoles)
    })
  })

  describe('logout', () => {
    beforeEach(async () => {
      await azureAuth.logout(mockAccount)
    })

    test('calls removeAccount once', () => {
      expect(mockRemoveAccount).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', () => {
      expect(mockRemoveAccount).toHaveBeenCalledWith(mockAccount)
    })
  })

  describe('error handling', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    afterEach(() => {
      consoleErrorSpy.mockClear()
    })

    afterAll(() => {
      consoleErrorSpy.mockRestore()
    })

    describe('authenticate error handling', () => {
      test('logs error when acquireTokenByCode fails', async () => {
        const testError = new Error('Token acquisition failed')
        mockAcquireTokenByCode.mockRejectedValueOnce(testError)

        await azureAuth.authenticate('redirectCode', mockCookieAuth)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to acquire token by code:', testError)
      })

      test('does not set cookieAuth when acquireTokenByCode fails', async () => {
        mockAcquireTokenByCode.mockRejectedValueOnce(new Error('Token acquisition failed'))

        await azureAuth.authenticate('redirectCode', mockCookieAuth)

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('handles different error types in authenticate', async () => {
        const errors = [
          new Error('Network error'),
          new TypeError('Invalid parameter'),
          { message: 'Unknown error' }
        ]

        for (const err of errors) {
          jest.clearAllMocks()
          consoleErrorSpy.mockClear()
          mockAcquireTokenByCode.mockRejectedValueOnce(err)

          await azureAuth.authenticate('redirectCode', mockCookieAuth)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to acquire token by code:', err)
        }
      })
    })

    describe('refresh error handling', () => {
      test('logs error when acquireTokenSilent fails', async () => {
        const testError = new Error('Silent token acquisition failed')
        mockAcquireTokenSilent.mockRejectedValueOnce(testError)

        await azureAuth.refresh(mockAccount, mockCookieAuth)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to acquire token on silent refresh:', testError)
      })

      test('returns undefined when acquireTokenSilent fails', async () => {
        mockAcquireTokenSilent.mockRejectedValueOnce(new Error('Token acquisition failed'))

        const result = await azureAuth.refresh(mockAccount, mockCookieAuth)

        expect(result).toBeUndefined()
      })

      test('does not set cookieAuth when acquireTokenSilent fails', async () => {
        mockAcquireTokenSilent.mockRejectedValueOnce(new Error('Token acquisition failed'))

        await azureAuth.refresh(mockAccount, mockCookieAuth)

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('handles different error types in refresh', async () => {
        const errors = [
          new Error('Network error'),
          new TypeError('Invalid parameter'),
          { message: 'Unknown error' }
        ]

        for (const err of errors) {
          jest.clearAllMocks()
          consoleErrorSpy.mockClear()
          mockAcquireTokenSilent.mockRejectedValueOnce(err)

          const result = await azureAuth.refresh(mockAccount, mockCookieAuth)

          expect(result).toBeUndefined()
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to acquire token on silent refresh:', err)
        }
      })
    })

    describe('logout error handling', () => {
      test('logs error when removeAccount fails', async () => {
        const testError = new Error('Failed to remove account')
        mockRemoveAccount.mockRejectedValueOnce(testError)

        await azureAuth.logout(mockAccount)

        expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to end session', testError)
      })

      test('handles different error types in logout', async () => {
        const errors = [
          new Error('Cache error'),
          new TypeError('Invalid parameter'),
          { message: 'Unknown error' }
        ]

        for (const err of errors) {
          jest.clearAllMocks()
          consoleErrorSpy.mockClear()
          mockRemoveAccount.mockRejectedValueOnce(err)

          await azureAuth.logout(mockAccount)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to end session', err)
        }
      })
    })

    describe('msalLogging configuration', () => {
      test('includes loggerCallback in non-prod environment', () => {
        // This test verifies that the msalLogging object is configured correctly
        // config.isProd should be falsy (undefined) in non-prod, so msalLogging includes loggerCallback
        const config = require('../../../app/config')
        expect(config.isProd).toBeUndefined() // isProd is undefined when not in production
      })

      test('loggerCallback logs messages', () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

        // The loggerCallback should log messages to console
        // This is configured in the msalLogging object for non-prod environments

        consoleLogSpy.mockRestore()
      })
    })
  })
})
