const { createServer } = require('../../../../app/server')

describe('cookies route', () => {
  let server

  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /cookies returns 200', async () => {
    const response = await server.inject({ method: 'GET', url: '/cookies' })
    expect(response.statusCode).toBe(200)
  })

  test('POST /cookies with analytics true redirects', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: true }
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toContain('/cookies?updated=true')
  })

  test('POST /cookies with analytics false redirects', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: false }
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toContain('/cookies?updated=true')
  })

  test('POST /cookies with async flag returns ok', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: true, async: true }
    })
    expect(response.statusCode).toBe(200)
    expect(response.result).toBe('ok')
  })
})
