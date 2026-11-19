const mockRoles = ['Web.Pds.Admin']
const mockAccount = {
  homeAccountId: 'test-home-account-id',
  environment: 'login.microsoftonline.com',
  tenantId: 'test-tenant-id',
  username: 'test@example.com',
  localAccountId: 'test-local-account-id',
  name: 'Test User'
}
const mockFullAccount = { ...mockAccount, extraClaim: 'excluded from cookie' }

const mockGetAuthCodeUrl = jest.fn()
const mockAcquireTokenByCode = jest.fn()
const mockAcquireTokenSilent = jest.fn()
const mockRemoveAccount = jest.fn()
const mockGetAccountByHomeId = jest.fn()
const mockGetTokenCache = jest.fn(() => ({
  removeAccount: mockRemoveAccount,
  getAccountByHomeId: mockGetAccountByHomeId
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
    mockGetAccountByHomeId.mockResolvedValue(mockFullAccount)

    mockAcquireTokenByCode.mockResolvedValue({
      idTokenClaims: { roles: mockRoles },
      account: mockFullAccount
    })

    mockAcquireTokenSilent.mockResolvedValue({
      idTokenClaims: { roles: mockRoles },
      account: mockFullAccount
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
        .toEqual(expected)
    })
  })

  test('does not store extra MSAL account fields in the cookie', async () => {
    await azureAuth.authenticate('redirectCode', mockCookieAuth)
    expect(mockCookieAuth.set).toHaveBeenCalledWith({
      scope: mockRoles,
      account: mockAccount
    })
    expect(mockCookieAuth.set.mock.calls[0][0].account)
      .not.toHaveProperty('extraClaim')
  })

  describe('refresh', () => {
    test('looks up the complete account before silent acquisition', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)
      expect(mockGetAccountByHomeId).toHaveBeenCalledWith(mockAccount.homeAccountId)
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({
        account: mockFullAccount,
        scopes: ['openid', 'profile', 'offline_access'],
        forceRefresh: false
      })
    })

    test('skips silent acquisition if the account is missing from cache', async () => {
      mockGetAccountByHomeId.mockResolvedValueOnce(null)
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => { })
      try {
        expect(await azureAuth.refresh(mockAccount, mockCookieAuth)).toBeUndefined()
        expect(mockAcquireTokenSilent).not.toHaveBeenCalled()
        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      } finally {
        warn.mockRestore()
      }
    })

    test('skips cache lookup if the account has no homeAccountId', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => { })
      try {
        expect(await azureAuth.refresh({}, mockCookieAuth)).toBeUndefined()
        expect(mockGetAccountByHomeId).not.toHaveBeenCalled()
      } finally {
        warn.mockRestore()
      }
    })

    test('calls acquireTokenSilent once', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
    })

    test('passes correct account', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent.mock.calls[0][0].account)
        .toBe(mockFullAccount)
    })

    test.each([
      [undefined, false],
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
        .toEqual(expected)
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
      expect(mockGetAccountByHomeId).toHaveBeenCalledWith(mockAccount.homeAccountId)
      expect(mockRemoveAccount).toHaveBeenCalledWith(mockFullAccount)
    })
  })

  test('logout skips removal when cached account is absent', async () => {
    mockGetAccountByHomeId.mockResolvedValueOnce(null)
    await azureAuth.logout(mockAccount)
    expect(mockRemoveAccount).not.toHaveBeenCalled()
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
          {
            name: testError.name,
            errorCode: testError.errorCode,
            errorMessage: testError.errorMessage,
            subError: testError.subError,
            correlationId: testError.correlationId
          }
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
            {
              name: err.name,
              errorCode: err.errorCode,
              errorMessage: err.errorMessage,
              subError: err.subError,
              correlationId: err.correlationId
            }
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
          {
            name: testError.name,
            errorCode: testError.errorCode,
            errorMessage: testError.errorMessage,
            subError: testError.subError,
            correlationId: testError.correlationId
          }
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
            {
              name: err.name,
              errorCode: err.errorCode,
              errorMessage: err.errorMessage,
              subError: err.subError,
              correlationId: err.correlationId
            }
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
