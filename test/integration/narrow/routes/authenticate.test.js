const { createServer } = require('../../../../app/server')

describe('authenticate route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /authenticate with no code returns 500', async () => {
    const response = await server.inject({ method: 'GET', url: '/authenticate' })
    expect(response.statusCode).toBe(500)
  })
})
