const { createServer } = require('../../../../app/server')

describe('request editor test', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  test('GET /request-editor route redirects to service URL', async () => {
    const options = {
      method: 'GET',
      url: '/request-editor',
      auth: {
        strategy: 'cookieAuth',
        credentials: {
          scope: ['Payment.Application.Admin'],
          account: { localAccountId: 'test-user' }
        }
      }
    }

    const response = await server.inject(options)
    expect([301, 302, 307]).toContain(response.statusCode)
    expect(response.headers.location).toBeDefined()
  })

  afterEach(async () => {
    await server.stop()
  })
})
