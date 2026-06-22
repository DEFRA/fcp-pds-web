jest.mock('../../../../app/auth', () => ({
  getAuthenticationUrl: jest.fn()
}))

const auth = require('../../../../app/auth')
const { createServer } = require('../../../../app/server')

describe('login route', () => {
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
    test('GET /login exists', async () => {
      auth.getAuthenticationUrl.mockResolvedValue('http://auth-url')
      const response = await server.inject({ method: 'GET', url: '/login' })
      expect(response.statusCode).not.toBe(404)
    })

    test('route has auth disabled', async () => {
      auth.getAuthenticationUrl.mockResolvedValue('http://auth-url')
      const response = await server.inject({ method: 'GET', url: '/login' })
      // Should not require authentication
      expect(response.statusCode).not.toBe(401)
    })
  })

  describe('successful authentication URL retrieval', () => {
    test('redirects to auth URL from getAuthenticationUrl', async () => {
      const authUrl = 'https://login.microsoftonline.com/authorize?...'
      auth.getAuthenticationUrl.mockResolvedValue(authUrl)

      const response = await server.inject({ method: 'GET', url: '/login' })

      expect([301, 302, 307]).toContain(response.statusCode)
      expect(response.headers.location).toBe(authUrl)
    })

    test('calls getAuthenticationUrl', async () => {
      auth.getAuthenticationUrl.mockResolvedValue('http://auth-url')
      await server.inject({ method: 'GET', url: '/login' })
      expect(auth.getAuthenticationUrl).toHaveBeenCalled()
    })

    test('handles different auth URLs', async () => {
      const authUrls = [
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?...',
        'https://auth-service.example.com/authorize',
        '/dev-auth'
      ]

      for (const authUrl of authUrls) {
        auth.getAuthenticationUrl.mockResolvedValueOnce(authUrl)
        const response = await server.inject({ method: 'GET', url: '/login' })
        expect(response.headers.location).toBe(authUrl)
      }
    })
  })

  describe('error handling', () => {
    test('returns 500 when getAuthenticationUrl throws error', async () => {
      const testError = new Error('Failed to get auth URL')
      auth.getAuthenticationUrl.mockRejectedValue(testError)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const response = await server.inject({ method: 'GET', url: '/login' })

      expect(response.statusCode).toBe(500)
      consoleSpy.mockRestore()
    })

    test('logs error message on getAuthenticationUrl failure', async () => {
      const testError = new Error('Auth service unavailable')
      auth.getAuthenticationUrl.mockRejectedValue(testError)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await server.inject({ method: 'GET', url: '/login' })

      expect(consoleSpy).toHaveBeenCalledWith('Error authenticating', testError)
      consoleSpy.mockRestore()
    })

    test('renders error view on authentication URL retrieval failure', async () => {
      auth.getAuthenticationUrl.mockRejectedValue(new Error('Service error'))
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      const response = await server.inject({ method: 'GET', url: '/login' })

      expect(response.statusCode).toBe(500)
      expect(response.payload).toContain('Internal Server Error')
      consoleSpy.mockRestore()
    })

    test('handles different error types', async () => {
      const errors = [
        new Error('Network timeout'),
        new TypeError('Invalid response format'),
        new Error('Authentication service down')
      ]

      for (const error of errors) {
        auth.getAuthenticationUrl.mockRejectedValueOnce(error)
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

        const response = await server.inject({ method: 'GET', url: '/login' })
        expect(response.statusCode).toBe(500)
        expect(consoleSpy).toHaveBeenCalledWith('Error authenticating', error)

        consoleSpy.mockRestore()
      }
    })
  })

  describe('sequential requests', () => {
    test('handles success followed by error', async () => {
      auth.getAuthenticationUrl.mockResolvedValueOnce('http://auth-url-1')
      const response1 = await server.inject({ method: 'GET', url: '/login' })
      expect(response1.statusCode).toBe(302)

      auth.getAuthenticationUrl.mockRejectedValueOnce(new Error('Error'))
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      const response2 = await server.inject({ method: 'GET', url: '/login' })
      expect(response2.statusCode).toBe(500)

      consoleSpy.mockRestore()
    })

    test('handles multiple successful requests with different URLs', async () => {
      const urls = ['http://auth-1', 'http://auth-2', 'http://auth-3']

      for (const url of urls) {
        auth.getAuthenticationUrl.mockResolvedValueOnce(url)
        const response = await server.inject({ method: 'GET', url: '/login' })
        expect(response.statusCode).toBe(302)
        expect(response.headers.location).toBe(url)
      }
    })

    test('handles multiple error requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      for (let i = 0; i < 3; i++) {
        auth.getAuthenticationUrl.mockRejectedValueOnce(new Error(`Error ${i}`))
        const response = await server.inject({ method: 'GET', url: '/login' })
        expect(response.statusCode).toBe(500)
      }

      expect(consoleSpy).toHaveBeenCalledTimes(3)
      consoleSpy.mockRestore()
    })
  })
})
