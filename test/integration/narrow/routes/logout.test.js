const { createServer } = require('../../../../app/server')

describe('logout route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /logout redirects to login', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/logout',
      auth: {
        strategy: 'cookieAuth',
        credentials: {
          scope: ['Payment.Application.Admin'],
          account: { homeAccountId: 'test-id', name: 'Test User' }
        }
      }
    })
    expect([301, 302, 307]).toContain(response.statusCode)
    expect(response.headers.location).toContain('/login')
  })
})
