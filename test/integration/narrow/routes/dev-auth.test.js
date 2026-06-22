jest.mock('../../../../app/auth', () => ({
  authenticate: jest.fn()
}))

const auth = require('../../../../app/auth')
const { createServer } = require('../../../../app/server')

describe('dev-auth route', () => {
  let server

  beforeEach(async () => {
    jest.clearAllMocks()
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('route configuration', () => {
    test('GET /dev-auth exists', async () => {
      const response = await server.inject({ method: 'GET', url: '/dev-auth' })
      expect(response.statusCode).not.toBe(404)
    })

    test('route has auth disabled', async () => {
      auth.authenticate.mockResolvedValue(undefined)
      const response = await server.inject({ method: 'GET', url: '/dev-auth' })
      // Should not require authentication
      expect(response.statusCode).not.toBe(401)
    })
  })

  describe('successful authentication', () => {
    test('redirects to home on successful auth', async () => {
      auth.authenticate.mockResolvedValue(undefined)
      const response = await server.inject({ method: 'GET', url: '/dev-auth' })
      expect([301, 302, 307]).toContain(response.statusCode)
      expect(response.headers.location).toBe('/')
    })

    test('calls auth.authenticate with undefined code', async () => {
      auth.authenticate.mockResolvedValue(undefined)
      await server.inject({ method: 'GET', url: '/dev-auth' })
      expect(auth.authenticate).toHaveBeenCalledWith(undefined, expect.any(Object))
    })

    test('passes cookieAuth handler to authenticate', async () => {
      auth.authenticate.mockResolvedValue(undefined)
      await server.inject({ method: 'GET', url: '/dev-auth' })
      const callArgs = auth.authenticate.mock.calls[0]
      expect(callArgs[1]).toBeDefined()
      expect(typeof callArgs[1]).toBe('object')
    })
  })

  describe('error handling', () => {
    test('returns 500 when authentication throws error', async () => {
      const testError = new Error('Authentication failed')
      auth.authenticate.mockRejectedValue(testError)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await server.inject({ method: 'GET', url: '/dev-auth' })

      expect(response.statusCode).toBe(500)
      consoleSpy.mockRestore()
    })

    test('logs error message on authentication failure', async () => {
      const testError = new Error('Test authentication error')
      auth.authenticate.mockRejectedValue(testError)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await server.inject({ method: 'GET', url: '/dev-auth' })

      expect(consoleSpy).toHaveBeenCalledWith('Error authenticating', testError)
      consoleSpy.mockRestore()
    })

    test('renders error view on authentication failure', async () => {
      auth.authenticate.mockRejectedValue(new Error('Auth failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const response = await server.inject({ method: 'GET', url: '/dev-auth' })

      expect(response.statusCode).toBe(500)
      expect(response.payload).toContain('Internal Server Error')
      consoleSpy.mockRestore()
    })

    test('handles different error types', async () => {
      const errors = [
        new Error('Network error'),
        new Error('Timeout'),
        new TypeError('Invalid response')
      ]

      for (const error of errors) {
        auth.authenticate.mockRejectedValueOnce(error)
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        const response = await server.inject({ method: 'GET', url: '/dev-auth' })
        expect(response.statusCode).toBe(500)
        expect(consoleSpy).toHaveBeenCalledWith('Error authenticating', error)

        consoleSpy.mockRestore()
      }
    })
  })

  describe('sequential requests', () => {
    test('handles success followed by error', async () => {
      auth.authenticate.mockResolvedValueOnce(undefined)
      const response1 = await server.inject({ method: 'GET', url: '/dev-auth' })
      expect(response1.statusCode).toBe(302)

      auth.authenticate.mockRejectedValueOnce(new Error('Error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const response2 = await server.inject({ method: 'GET', url: '/dev-auth' })
      expect(response2.statusCode).toBe(500)

      consoleSpy.mockRestore()
    })

    test('handles multiple successful requests', async () => {
      auth.authenticate.mockResolvedValue(undefined)

      for (let i = 0; i < 3; i++) {
        const response = await server.inject({ method: 'GET', url: '/dev-auth' })
        expect(response.statusCode).toBe(302)
      }

      expect(auth.authenticate).toHaveBeenCalledTimes(3)
    })
  })
})
