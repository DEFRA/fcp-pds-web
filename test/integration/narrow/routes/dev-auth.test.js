const { createServer } = require('../../../../app/server')

describe('dev-auth route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /dev-auth redirects to home', async () => {
    const response = await server.inject({ method: 'GET', url: '/dev-auth' })
    expect([301, 302, 307]).toContain(response.statusCode)
    expect(response.headers.location).toBe('/')
  })
})
