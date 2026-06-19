const { createServer } = require('../../../../app/server')

describe('login route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /login redirects to auth URL', async () => {
    const response = await server.inject({ method: 'GET', url: '/login' })
    expect([301, 302, 307]).toContain(response.statusCode)
    expect(response.headers.location).toBeDefined()
  })
})
