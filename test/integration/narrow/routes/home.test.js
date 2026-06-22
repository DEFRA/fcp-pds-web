const { createServer } = require('../../../../app/server')

describe('home route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET / returns 200 with accessible cards', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
      auth: {
        strategy: 'cookieAuth',
        credentials: {
          scope: ['Payment.Application.Admin'],
          account: { homeAccountId: 'test-id', name: 'Test User' }
        }
      }
    })
    expect(response.statusCode).toBe(200)
  })

  test('GET / with multiple roles returns 200', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
      auth: {
        strategy: 'cookieAuth',
        credentials: {
          scope: [
            'Payment.Application.Admin',
            'Payment.Scheme.Admin',
            'Payment.Hold.Admin',
            'Payment.Data.View'
          ],
          account: { homeAccountId: 'test-id', name: 'Test User' }
        }
      }
    })
    expect(response.statusCode).toBe(200)
  })
})
