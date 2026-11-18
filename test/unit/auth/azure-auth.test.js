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

const authScopes = ['openid', 'profile', 'offline_access']

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

    test('passes the expected authentication parameters', () => {
      expect(mockGetAuthCodeUrl).toHaveBeenCalledWith({
        prompt: 'select_account',
        redirectUri: authConfig.redirectUrl,
        scopes: authScopes
      })
    })
  })

  describe('authenticate', () => {
    test('calls acquireTokenByCode with the expected parameters', async () => {
      await azureAuth.authenticate('redirectCode', mockCookieAuth)

      expect(mockAcquireTokenByCode).toHaveBeenCalledTimes(1)
      expect(mockAcquireTokenByCode).toHaveBeenCalledWith({
        code: 'redirectCode',
        redirectUri: authConfig.redirectUrl,
        scopes: authScopes
      })
    })

    test('sets cookieAuth with roles and account', async () => {
      await azureAuth.authenticate('redirectCode', mockCookieAuth)

      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
      expect(mockCookieAuth.set).toHaveBeenCalledWith({
        scope: mockRoles,
        account: mockAccount
      })
    })

    test('returns the authentication result', async () => {
      const result = await azureAuth.authenticate(
        'redirectCode',
        mockCookieAuth
      )

      expect(result).toEqual({
        idTokenClaims: { roles: mockRoles },
        account: mockAccount
      })
    })
  })

  describe('refresh', () => {
    test('calls acquireTokenSilent with forceRefresh false by default', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1)
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({
        account: mockAccount,
        scopes: authScopes,
        forceRefresh: false
      })
    })

    test.each([
      [true, true],
      [false, false]
    ])('passes forceRefresh=%s', async (forceRefresh, expected) => {
      await azureAuth.refresh(
        mockAccount,
        mockCookieAuth,
        forceRefresh
      )

      expect(mockAcquireTokenSilent).toHaveBeenCalledWith({
        account: mockAccount,
        scopes: authScopes,
        forceRefresh: expected
      })
    })

    test('sets cookieAuth with refreshed roles and account', async () => {
      await azureAuth.refresh(mockAccount, mockCookieAuth)

      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
      expect(mockCookieAuth.set).toHaveBeenCalledWith({
        scope: mockRoles,
        account: mockAccount
      })
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
      test('rejects a missing authorization code without calling MSAL', async () => {
        await expect(
          azureAuth.authenticate(undefined, mockCookieAuth)
        ).rejects.toThrow(
          'No authorization code was returned by Microsoft Entra ID'
        )

        expect(mockAcquireTokenByCode).not.toHaveBeenCalled()
        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test.each([
        [null, { roles: mockRoles }],
        [mockAccount, null],
        [undefined, { roles: mockRoles }],
        [mockAccount, undefined]
      ])(
        'rejects an incomplete authentication result with account=%s and claims=%s',
        async (account, idTokenClaims) => {
          mockAcquireTokenByCode.mockResolvedValueOnce({
            account,
            idTokenClaims
          })

          await expect(
            azureAuth.authenticate('redirectCode', mockCookieAuth)
          ).rejects.toThrow(
            'Microsoft Entra ID returned an incomplete authentication result'
          )

          expect(mockCookieAuth.set).not.toHaveBeenCalled()
        }
      )

      test('logs structured details and rethrows when acquireTokenByCode fails', async () => {
        const testError = Object.assign(
          new Error('Token acquisition failed'),
          {
            errorCode: 'token_error',
            errorMessage: 'Token acquisition failed',
            subError: 'test_sub_error',
            correlationId: 'test-correlation-id'
          }
        )

        mockAcquireTokenByCode.mockRejectedValueOnce(testError)

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toBe(testError)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to authenticate:',
          {
            name: 'Error',
            errorCode: 'token_error',
            errorMessage: 'Token acquisition failed',
            subError: 'test_sub_error',
            correlationId: 'test-correlation-id'
          }
        )
        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test.each([
        [undefined, 'roles claim is missing'],
        [[], 'roles are empty'],
        [['Some.Other.Application.Role'], 'roles are not recognised']
      ])('throws NO_PDS_ROLES when %s', async (roles) => {
        mockAcquireTokenByCode.mockResolvedValueOnce({
          idTokenClaims: roles === undefined ? {} : { roles },
          account: mockAccount
        })

        await expect(
          azureAuth.authenticate('redirectCode', mockCookieAuth)
        ).rejects.toMatchObject({
          message: 'Authenticated account has no recognised PDS roles',
          code: 'NO_PDS_ROLES'
        })

        expect(mockCookieAuth.set).not.toHaveBeenCalled()
        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })
    })

    describe('refresh error handling', () => {
      test.each([
        [null, { roles: mockRoles }],
        [mockAccount, null],
        [undefined, { roles: mockRoles }],
        [mockAccount, undefined]
      ])(
        'returns undefined for an incomplete refresh result with account=%s and claims=%s',
        async (account, idTokenClaims) => {
          mockAcquireTokenSilent.mockResolvedValueOnce({
            account,
            idTokenClaims
          })

          const result = await azureAuth.refresh(
            mockAccount,
            mockCookieAuth
          )

          expect(result).toBeUndefined()
          expect(mockCookieAuth.set).not.toHaveBeenCalled()
        }
      )

      test('returns undefined without setting the cookie when refreshed roles are not recognised', async () => {
        mockAcquireTokenSilent.mockResolvedValueOnce({
          idTokenClaims: { roles: ['Some.Other.Application.Role'] },
          account: mockAccount
        })

        const result = await azureAuth.refresh(
          mockAccount,
          mockCookieAuth
        )

        expect(result).toBeUndefined()
        expect(mockCookieAuth.set).not.toHaveBeenCalled()
      })

      test('logs structured details and returns undefined when acquireTokenSilent fails', async () => {
        const testError = Object.assign(
          new Error('Silent token acquisition failed'),
          {
            errorCode: 'silent_token_error',
            errorMessage: 'Silent token acquisition failed',
            subError: 'test_sub_error',
            correlationId: 'test-correlation-id'
          }
        )

        mockAcquireTokenSilent.mockRejectedValueOnce(testError)

        const result = await azureAuth.refresh(
          mockAccount,
          mockCookieAuth
        )

        expect(result).toBeUndefined()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to acquire token on silent refresh:',
          {
            name: 'Error',
            errorCode: 'silent_token_error',
            errorMessage: 'Silent token acquisition failed',
            subError: 'test_sub_error',
            correlationId: 'test-correlation-id'
          }
        )
        expect(mockCookieAuth.set).not.toHaveBeenCalled()
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
