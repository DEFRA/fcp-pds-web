const authPlugin = require('../../../app/plugins/auth')
const { validateSession } = require('../../../app/plugins/auth')
const { createServer } = require('../../../app/server')

describe('auth plugin', () => {
  describe('plugin structure', () => {
    test('plugin exports correct structure', () => {
      expect(authPlugin.plugin).toBeDefined()
      expect(authPlugin.plugin.name).toBe('auth')
      expect(typeof authPlugin.plugin.register).toBe('function')
    })
  })

  describe('integration with server', () => {
    let server

    beforeEach(async () => {
      server = await createServer()
    })

    afterEach(async () => {
      await server.stop()
    })

    test('auth plugin registers successfully', () => {
      // If we get here without error, plugin is registered
      expect(server).toBeDefined()
      expect(server.auth).toBeDefined()
    })

    test('allows access with valid credentials', async () => {
      server.route({
        method: 'GET',
        path: '/protected-test',
        options: {
          auth: {
            scope: ['admin']
          }
        },
        handler: () => ({ success: true })
      })

      const response = await server.inject({
        method: 'GET',
        url: '/protected-test',
        auth: {
          strategy: 'cookieAuth',
          credentials: {
            account: { homeAccountId: 'test-id', name: 'Test User' },
            scope: ['admin']
          }
        }
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload).success).toBe(true)
    })

    test('denies access without credentials', async () => {
      server.route({
        method: 'GET',
        path: '/protected-test',
        options: {
          auth: {
            scope: ['admin']
          }
        },
        handler: () => ({ success: true })
      })

      const response = await server.inject({
        method: 'GET',
        url: '/protected-test'
      })

      expect(response.statusCode).toBe(401)
    })

    test('allows routes with auth: false', async () => {
      server.route({
        method: 'GET',
        path: '/public-test',
        options: {
          auth: false
        },
        handler: () => ({ public: true })
      })

      const response = await server.inject({
        method: 'GET',
        url: '/public-test'
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload).public).toBe(true)
    })
  })

  describe('validateFunc behavior', () => {
    test('accepts valid session with account', async () => {
      const session = {
        account: { homeAccountId: 'id1', name: 'User1' },
        scope: ['admin']
      }
      const result = await validateSession(null, session)
      expect(result.valid).toBe(true)
      expect(result.credentials).toBe(session)
    })

    test('rejects session without account', async () => {
      const session = { scope: ['admin'] }
      const result = await validateSession(null, session)
      expect(result.valid).toBe(false)
    })

    test('rejects null session', async () => {
      const result = await validateSession(null, null)
      expect(result.valid).toBe(false)
    })

    test('rejects undefined session', async () => {
      const result = await validateSession(null, undefined)
      expect(result.valid).toBe(false)
    })

    test('rejects session with null account', async () => {
      const session = { account: null, scope: ['admin'] }
      const result = await validateSession(null, session)
      expect(result.valid).toBe(false)
    })

    test('accepts session with empty account (any truthy account object)', async () => {
      const session = { account: {}, scope: ['admin'] }
      const result = await validateSession(null, session)
      expect(result.valid).toBe(true)
      expect(result.credentials).toBe(session)
    })

    test('handles various truthy account values', async () => {
      const testCases = [
        { account: { homeAccountId: 'a1', name: 'Alice' } },
        { account: { id: 'b1' } },
        { account: { any: 'property' } }
      ]

      for (const session of testCases) {
        const result = await validateSession(null, session)
        expect(result.valid).toBe(true)
        expect(result.credentials).toBe(session)
      }
    })

    test('logs error handling in cookie configuration', () => {
      // Verify cookie settings are as expected
      const config = require('../../../app/config')
      expect(config.authConfig).toBeDefined()
      expect(config.authConfig.cookie).toBeDefined()
      expect(config.authConfig.cookie.password).toBeDefined()
      expect(typeof config.authConfig.cookie.ttl).toBe('number')
    })
  })
})
