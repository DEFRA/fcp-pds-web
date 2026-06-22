const { createServer } = require('../../../../app/server')

describe('sitemap route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /sitemap returns 200', async () => {
    const response = await server.inject({ method: 'GET', url: '/sitemap' })
    expect(response.statusCode).toBe(200)
  })
})
