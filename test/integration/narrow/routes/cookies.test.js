jest.mock('../../../../app/config', () => {
  const config = jest.requireActual('../../../../app/config')
  const analyticsSettings = {
    googleAnalyticsMeasurementId: 'G-5CZ5WF6BZS',
    analyticsEnabled: true,
    analyticsAlwaysTrack: false
  }
  return {
    ...config,
    get: setting => Object.hasOwn(analyticsSettings, setting) ? analyticsSettings[setting] : config.get(setting)
  }
})

const { createServer } = require('../../../../app/server')
const visionPlugin = require('../../../../app/plugins/vision')

const getPolicyCookie = response => response.headers['set-cookie']
  .find(cookie => cookie.startsWith('cookies_policy='))
  .split(';')[0]

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
    expect(response.payload).not.toContain('www.googletagmanager.com')

    const { states } = await server.states.parse(getPolicyCookie(response))
    expect(states.cookies_policy).toEqual({ essential: true, confirmed: false, analytics: false })
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

  test.each([true, false])('persists analytics consent %s and applies it to the next page', async analytics => {
    const response = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics, async: true }
    })
    expect(response.statusCode).toBe(200)

    const cookie = getPolicyCookie(response)
    const { states } = await server.states.parse(cookie)
    expect(states.cookies_policy).toEqual({ essential: true, confirmed: true, analytics })

    const page = await server.inject({ method: 'GET', url: '/privacy', headers: { cookie } })
    expect(page.statusCode).toBe(200)
    if (analytics) {
      expect(page.payload).toContain('https://www.googletagmanager.com/gtag/js?id=G-5CZ5WF6BZS')
      expect(page.payload).toContain("gtag('config', 'G-5CZ5WF6BZS')")
    } else {
      expect(page.payload).not.toContain('www.googletagmanager.com')
    }
  })

  test('withdraws existing consent, expires analytics cookies and removes the tag on the next page', async () => {
    const accepted = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: true, async: true }
    })
    const response = await server.inject({
      method: 'POST',
      url: '/cookies',
      headers: { cookie: getPolicyCookie(accepted) },
      payload: { analytics: false, async: true }
    })
    expect(response.statusCode).toBe(200)

    for (const cookieName of ['_ga', '_ga_5CZ5WF6BZS', '_gid']) {
      const clearedCookie = response.headers['set-cookie'].find(cookie => cookie.startsWith(`${cookieName}=`))
      expect(clearedCookie).toContain('Max-Age=0')
    }

    const cookie = getPolicyCookie(response)
    const { states } = await server.states.parse(cookie)
    expect(states.cookies_policy).toEqual({ essential: true, confirmed: true, analytics: false })

    const page = await server.inject({ method: 'GET', url: '/privacy', headers: { cookie } })
    expect(page.statusCode).toBe(200)
    expect(page.payload).not.toContain('www.googletagmanager.com')
  })

  test('does not reuse another visitor\'s analytics consent', async () => {
    const accepted = await server.inject({
      method: 'POST',
      url: '/cookies',
      payload: { analytics: true, async: true }
    })
    const cookie = getPolicyCookie(accepted)
    const consentedPage = await server.inject({ method: 'GET', url: '/privacy', headers: { cookie } })
    expect(consentedPage.payload).toContain('www.googletagmanager.com/gtag/js')

    const anonymousPage = await server.inject({ method: 'GET', url: '/privacy' })
    expect(anonymousPage.statusCode).toBe(200)
    expect(anonymousPage.payload).not.toContain('www.googletagmanager.com')
  })

  describe.each([
    ['disabled', false, false, false, false],
    ['disabled with override', false, true, false, false],
    ['consent-based', true, false, false, true],
    ['always tracking', true, true, true, true]
  ])('analytics configuration: %s', (_description, analyticsEnabled, analyticsAlwaysTrack, withoutConsent, withConsent) => {
    let originalSettings

    beforeAll(() => {
      originalSettings = {
        analyticsEnabled: visionPlugin.options.context.analyticsEnabled,
        analyticsAlwaysTrack: visionPlugin.options.context.analyticsAlwaysTrack
      }
      Object.assign(visionPlugin.options.context, { analyticsEnabled, analyticsAlwaysTrack })
    })

    afterAll(() => {
      Object.assign(visionPlugin.options.context, originalSettings)
    })

    test('applies the settings before a visitor has made a choice', async () => {
      const response = await server.inject({ method: 'GET', url: '/privacy' })

      expect(response.statusCode).toBe(200)
      expect(response.payload.includes('www.googletagmanager.com/gtag/js')).toBe(withoutConsent)
    })

    test.each([true, false])('preserves consent=%s and applies the configured tracking mode', async analytics => {
      const preference = await server.inject({
        method: 'POST',
        url: '/cookies',
        payload: { analytics, async: true }
      })
      expect(preference.statusCode).toBe(200)

      const cookie = getPolicyCookie(preference)
      const { states } = await server.states.parse(cookie)
      expect(states.cookies_policy).toEqual({ essential: true, confirmed: true, analytics })

      const page = await server.inject({ method: 'GET', url: '/privacy', headers: { cookie } })
      const expected = analytics ? withConsent : withoutConsent

      expect(page.statusCode).toBe(200)
      expect(page.payload.includes('www.googletagmanager.com/gtag/js')).toBe(expected)
      expect(page.payload.includes("gtag('config', 'G-5CZ5WF6BZS')")).toBe(expected)
    })
  })
})
