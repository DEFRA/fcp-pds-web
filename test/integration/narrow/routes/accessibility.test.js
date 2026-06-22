const { createServer } = require('../../../../app/server')

describe('accessibility route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /accessibility returns 200', async () => {
    const response = await server.inject({ method: 'GET', url: '/accessibility' })
    expect(response.statusCode).toBe(200)
  })
})
