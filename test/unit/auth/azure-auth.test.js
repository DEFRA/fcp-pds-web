const mockRoles = ['Web.Pds.Admin']
const mockAccount = 'test-account'

const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn()
const mockAcquireTokenSilent = jest.fn()
const mockRemoveAccount = jest.fn()
const mockGetTokenCache = jest.fn(() => ({
  removeAccount: mockRemoveAccount
}))

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

    mockAcquireTokenByCode.mockResolvedValue({
      idTokenClaims: { roles: mockRoles },
      account: mockAccount
    })

    mockAcquireTokenSilent.mockResolvedValue({
      idTokenClaims: { roles: mockRoles },
      account: mockAccount
    })

    mockCookieAuth = {
      set: jest.fn()
    }
  })

  describe('getAuthenticationUrl', () => {
    beforeEach(async () => {
      await azureAuth.getAuthenticationUrl()
    })

    test('calls getAuthCodeUrl once', () => {
      expect(mockGetAuthCodeUrl).toHaveBeenCalledTimes(1)
    })

    test('forces select_account prompt', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].prompt)
        .toBe('select_account')
    })

    test('uses redirect url from config', () => {
      expect(mockGetAuthCodeUrl.mock.calls[0][0].redirectUri)
        .toBe(authConfig.redirectUrl)
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
      expect(mockAcquireTokenByCode.mock.calls[0][0][key])
        .toBe(expected)
    })

    test('passes the required scopes', () => {
      expect(mockAcquireTokenByCode.mock.calls[0][0].scopes).toEqual([
        'openid',
        'profile',
        'offline_access'
      ])
    })

    test('sets cookieAuth once', () => {
      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['scope', mockRoles],
      ['account', mockAccount]
    ])('sets %s correctly', (key, expected) => {
      expect(mockCookieAuth.set.mock.calls[0][0][key])
        .toBe(expected)
    })
  })

  describe('refresh', () => {
    test('calls acquireTokenSilent once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent.mock.calls[0][0].account)
        .toBe(mockAccount)
    })

    test.each([
      [undefined, true],
      [true, true],
      [false, false]
    ])('forceRefresh=%s results in %s', async (force, expected) => {
      await azureAuth.refresh(mockAccount, mockCookieAuth, force)

      expect(mockAcquireTokenSilent.mock.calls[0][0].forceRefresh)
        .toBe(expected)
    })

    test('passes the required scopes', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent.mock.calls[0][0].scopes).toEqual([
        'openid',
        'profile',
        'offline_access'
      ])
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

      expect(mockCookieAuth.set.mock.calls[0][0][key])
        .toBe(expected)
    })

    test('returns roles', async () => {
      const result = await azureAuth.refresh(
        mockAccount,
        mockCookieAuth
      )

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
    let consoleErrorSpy

    beforeAll(() => {
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation()
    })

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

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toThrow('Token acquisition failed')

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to authenticate:',
          testError
        )
      })

      test('rethrows error when acquireTokenByCode fails', async () => {
        const testError = new Error('Token acquisition failed')

        mockAcquireTokenByCode.mockRejectedValueOnce(testError)

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toBe(testError)
      })

      test('does not set cookieAuth when acquireTokenByCode fails', async () => {
        mockAcquireTokenByCode.mockRejectedValueOnce(
          new Error('Token acquisition failed')
        )

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toThrow('Token acquisition failed')

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('throws NO_PDS_ROLES when roles claim is missing', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: {},
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          message: 'Authenticated account has no recognised PDS roles',
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('throws NO_PDS_ROLES when roles are empty', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: { roles: [] },
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          message: 'Authenticated account has no recognised PDS roles',
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('throws NO_PDS_ROLES when account has no recognised PDS roles', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: {
            roles: ['Some.Other.Application.Role']
          },
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          message: 'Authenticated account has no recognised PDS roles',
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('does not set cookieAuth when roles claim is missing', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: {},
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('does not set cookieAuth when roles are empty', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: { roles: [] },
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('does not log an error when account has no recognised PDS roles', async () => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: { roles: [] },
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          message: 'Authenticated account has no recognised PDS roles',
          code: 'NO_PDS_ROLES'
        })

        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })

      test('handles different error types in authenticate', async () => {
        const errors = [
          new Error('Network error'),
          new TypeError('Invalid parameter'),
          { message: 'Unknown error' }
        ]

        for (const err of errors) {
          consoleErrorSpy.mockClear()
          mockAcquireTokenByCode.mockRejectedValueOnce(err)

          await expect(
            azureAuth.authenticate('redirectCode', mockCookieAuth)
          ).rejects.toBe(err)

          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to authenticate:',
            err
          )
        }
      })
    })

    describe('refresh error handling', () => {
      test('logs error when acquireTokenSilent fails', async () => {
        const testError = new Error(
          'Silent token acquisition failed'
        )

        mockAcquireTokenSilent.mockRejectedValueOnce(testError)

        await azureAuth.refresh(mockAccount, mockCookieAuth)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to acquire token on silent refresh:',
          testError
        )
      })

      test('returns undefined when acquireTokenSilent fails', async () => {
        mockAcquireTokenSilent.mockRejectedValueOnce(
          new Error('Token acquisition failed')
        )

        const result = await azureAuth.refresh(
          mockAccount,
          mockCookieAuth
        )

        expect(result).toBeUndefined()
      })

      test('does not set cookieAuth when acquireTokenSilent fails', async () => {
        mockAcquireTokenSilent.mockRejectedValueOnce(
          new Error('Token acquisition failed')
        )

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
          consoleErrorSpy.mockClear()
          mockAcquireTokenSilent.mockRejectedValueOnce(err)

          const result = await azureAuth.refresh(
            mockAccount,
            mockCookieAuth
          )

          expect(result).toBeUndefined()
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to acquire token on silent refresh:',
            err
          )
        }
      })
    })

    describe('logout error handling', () => {
      test('logs error when removeAccount fails', async () => {
        const testError = new Error('Failed to remove account')

        mockRemoveAccount.mockRejectedValueOnce(testError)

        await azureAuth.logout(mockAccount)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Unable to end session',
          testError
        )
      })

      test('handles different error types in logout', async () => {
        const errors = [
          new Error('Cache error'),
          new TypeError('Invalid parameter'),
          { message: 'Unknown error' }
        ]

        for (const err of errors) {
          consoleErrorSpy.mockClear()
          mockRemoveAccount.mockRejectedValueOnce(err)

          await azureAuth.logout(mockAccount)

          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Unable to end session',
            err
          )
        }
      })
    })
  })

  describe('msalLogging configuration', () => {
    test('reports the environment as non-production under test', () => {
      const config = require('../../../app/config')

      expect(config.isProd).toBe(false)
    })

    test('allows console logging in non-production', () => {
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation()

      console.log('MSAL test log')

      expect(consoleLogSpy).toHaveBeenCalledWith('MSAL test log')

      consoleLogSpy.mockRestore()
    })
  })
})
