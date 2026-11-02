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

  beforeEach(async () => {
    jest.clearAllMocks()

    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
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

  test('GET /authenticate returns 500 when authentication fails', async () => {
    mockAuthenticate.mockRejectedValueOnce(
      new Error('Token acquisition failed')
    )

    const response = await server.inject({
      method: 'GET',
      url: '/authenticate?code=test-code'
    })

    expect(response.statusCode).toBe(500)
    expect(response.headers.location).toBeUndefined()
  })

  test('GET /authenticate with no code returns 500', async () => {
    mockAuthenticate.mockRejectedValueOnce(
      new Error('No code provided')
    )

    const response = await server.inject({
      method: 'GET',
      url: '/authenticate'
    })

    expect(response.statusCode).toBe(500)
    expect(response.headers.location).toBeUndefined()
  })
})
