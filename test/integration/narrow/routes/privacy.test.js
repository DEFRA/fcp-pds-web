const { createServer } = require('../../../../app/server')

describe('privacy route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /privacy returns 200', async () => {
    const response = await server.inject({ method: 'GET', url: '/privacy' })
    expect(response.statusCode).toBe(200)
  })
})
