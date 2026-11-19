const mockAuthenticate = jest.fn()

jest.mock('../../../../app/auth', () => ({
  getAuthenticationUrl: jest.fn().mockResolvedValue('/login'),
  authenticate: mockAuthenticate,
  mapAuth: jest.fn(),
  getUser: jest.fn()
}))

const { createServer } = require('../../../../app/server')

describe('authenticate route', () => {
  let server
  let consoleErrorSpy

  beforeAll(() => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  test('GET /authenticate redirects to home when authentication succeeds', async () => {
    mockAuthenticate.mockResolvedValueOnce()

    const response = await server.inject({
      method: 'GET',
      url: '/authenticate?code=test-code'
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/')
    expect(mockAuthenticate).toHaveBeenCalledTimes(1)
    expect(mockAuthenticate).toHaveBeenCalledWith(
      'test-code',
      expect.anything()
    )
  })

  test('GET /authenticate returns 403 when account has no PDS roles', async () => {
    const error = new Error(
      'Authenticated account has no recognised PDS roles'
    )
    error.code = 'NO_PDS_ROLES'
    mockAuthenticate.mockRejectedValueOnce(error)

    const response = await server.inject({
      method: 'GET',
      url: '/authenticate?code=test-code'
    })

    expect(response.statusCode).toBe(403)
    expect(response.headers.location).toBeUndefined()
  })

  test('GET /authenticate returns 500 instead of redirecting when authentication fails', async () => {
    const error = Object.assign(
      new Error('Token acquisition failed'),
      {
        errorCode: 'token_error',
        errorMessage: 'Token acquisition failed',
        subError: 'test_sub_error',
        correlationId: 'test-correlation-id'
      }
    )
    mockAuthenticate.mockRejectedValueOnce(error)

    const response = await server.inject({
      method: 'GET',
      url: '/authenticate?code=test-code'
    })

    expect(response.statusCode).toBe(500)
    expect(response.headers.location).toBeUndefined()
    expect(mockAuthenticate).toHaveBeenCalledWith(
      'test-code',
      expect.anything()
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error authenticating:',
      {
        name: 'Error',
        errorCode: 'token_error',
        errorMessage: 'Token acquisition failed',
        correlationId: 'test-correlation-id'
      }
    )
  })

  test('GET /authenticate with no code returns 500 without calling authenticate', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/authenticate'
    })

    expect(response.statusCode).toBe(500)
    expect(response.headers.location).toBeUndefined()
    expect(mockAuthenticate).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Authentication callback missing authorization code'
    )
  })

  test('GET /authenticate returns 500 when Entra returns an error', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/authenticate?error=access_denied'
    })

    expect(response.statusCode).toBe(500)
    expect(response.headers.location).toBeUndefined()
    expect(mockAuthenticate).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Microsoft Entra authentication failed:',
      { error: 'access_denied' }
    )
  })
})
