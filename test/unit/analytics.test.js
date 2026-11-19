const path = require('node:path')
const vm = require('node:vm')
const nunjucks = require('nunjucks')

const measurementId = 'G-5CZ5WF6BZS'
const tagUrl = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
const environment = new nunjucks.Environment(new nunjucks.FileSystemLoader([
  path.join(__dirname, '../../app/views'),
  path.join(__dirname, '../../node_modules/govuk-frontend/dist')
]), { autoescape: true })

environment.addGlobal('getAssetPath', assetPath => `/static${assetPath}`)

describe('Google Analytics', () => {
  describe.each(['_layout.template.njk', '_layout.njk'])('%s', template => {
    const renderLayout = context => environment.render(template, {
      serviceName: 'Payment and Document Services',
      auth: { isAuthenticated: false },
      googleAnalyticsMeasurementId: measurementId,
      analyticsEnabled: true,
      analyticsAlwaysTrack: false,
      ...context
    })

    test.each([
      ['no preference', undefined],
      ['no decision', { analytics: false, confirmed: false }],
      ['rejected analytics', { analytics: false, confirmed: true }],
      ['no analytics permission', { confirmed: true }]
    ])('does not render a Google tag with %s', (_description, cookiesPolicy) => {
      const html = renderLayout({ cookiesPolicy })

      expect(html).not.toContain('www.googletagmanager.com')
      expect(html).not.toContain("gtag('config'")
    })

    test('renders one asynchronous Google tag in the head after consent', () => {
      const html = renderLayout({ cookiesPolicy: { analytics: true, confirmed: true } })
      const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))

      expect(head).toContain(tagUrl)
      expect(head).toMatch(/<script\s+async\s+src=/)
      expect(html.split(tagUrl)).toHaveLength(2)
      expect(head).toContain(`gtag('config', '${measurementId}')`)
      expect(html).not.toContain('googletagmanager.com/gtm.js')
      expect(html).not.toContain('googletagmanager.com/ns.html')
    })

    test.each([
      [false, false, false, false],
      [false, false, true, false],
      [false, true, false, false],
      [false, true, true, false],
      [true, false, false, false],
      [true, false, true, true],
      [true, true, false, true],
      [true, true, true, true]
    ])('enabled=%s, alwaysTrack=%s, consent=%s renders analytics=%s', (analyticsEnabled, analyticsAlwaysTrack, analytics, expected) => {
      const html = renderLayout({
        analyticsEnabled,
        analyticsAlwaysTrack,
        cookiesPolicy: { analytics, confirmed: true }
      })

      expect(html.includes(tagUrl)).toBe(expected)
      expect(html.includes(`gtag('config', '${measurementId}')`)).toBe(expected)
    })

    test.each([undefined, null, {}])('allows an explicit override without a consent preference (%s)', cookiesPolicy => {
      const html = renderLayout({ analyticsAlwaysTrack: true, cookiesPolicy })

      expect(html).toContain(tagUrl)
      expect(html.split(tagUrl)).toHaveLength(2)
    })

    test('fails closed when the global enabled setting is missing', () => {
      const html = renderLayout({
        analyticsEnabled: undefined,
        analyticsAlwaysTrack: true,
        cookiesPolicy: { analytics: true, confirmed: true }
      })

      expect(html).not.toContain('www.googletagmanager.com')
    })

    test.each([
      ['', false],
      [undefined, false],
      ['', true],
      [undefined, true]
    ])('does not render without a measurement ID (%s), even with alwaysTrack=%s', (googleAnalyticsMeasurementId, analyticsAlwaysTrack) => {
      const html = renderLayout({
        cookiesPolicy: { analytics: true, confirmed: true },
        googleAnalyticsMeasurementId,
        analyticsAlwaysTrack
      })

      expect(html).not.toContain('www.googletagmanager.com')
      expect(html).not.toContain("gtag('config'")
    })
  })

  describe('tag initialisation', () => {
    const initialiseTag = window => {
      const html = environment.render('tag-manager/_head-content.njk', {
        googleAnalyticsMeasurementId: measurementId
      })
      const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1]

      vm.runInNewContext(inlineScript, { window, Date })
      return window.dataLayer.map(command => Array.from(command))
    }

    test('creates a data layer and queues initialisation and configuration once', () => {
      const window = {}
      const commands = initialiseTag(window)

      expect(commands).toEqual([
        ['js', expect.any(Date)],
        ['config', measurementId]
      ])
    })

    test('preserves events already in the data layer', () => {
      const existingEvent = { event: 'existing-event' }
      const dataLayer = [existingEvent]
      const window = { dataLayer }

      initialiseTag(window)

      expect(window.dataLayer).toBe(dataLayer)
      expect(dataLayer).toHaveLength(3)
      expect(dataLayer[0]).toBe(existingEvent)
      expect(Array.from(dataLayer[2])).toEqual(['config', measurementId])
    })

    test('uses the configured measurement ID rather than a hard-coded ID', () => {
      const html = environment.render('tag-manager/_head-content.njk', {
        googleAnalyticsMeasurementId: 'G-TEST12345'
      })

      expect(html).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST12345')
      expect(html).toContain("gtag('config', 'G-TEST12345')")
      expect(html).not.toContain(measurementId)
    })
  })

  describe('configuration', () => {
    const environmentVariables = [
      'GOOGLE_ANALYTICS_MEASUREMENT_ID',
      'ANALYTICS_ENABLED',
      'ANALYTICS_ALWAYS_TRACK'
    ]
    const originalEnvironment = Object.fromEntries(environmentVariables.map(name => [name, process.env[name]]))

    beforeEach(() => {
      for (const name of environmentVariables) {
        delete process.env[name]
      }
    })

    afterEach(() => {
      for (const [name, value] of Object.entries(originalEnvironment)) {
        if (value === undefined) {
          delete process.env[name]
        } else {
          process.env[name] = value
        }
      }
    })

    test('defaults to no measurement ID when the environment variable is absent', () => {
      delete process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID

      jest.isolateModules(() => {
        const config = require('../../app/config')
        expect(config.get('googleAnalyticsMeasurementId')).toBe('')
      })
    })

    test('reads the measurement ID from the environment variable', () => {
      process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-TEST12345'

      jest.isolateModules(() => {
        const config = require('../../app/config')
        expect(config.get('googleAnalyticsMeasurementId')).toBe('G-TEST12345')
      })
    })

    test('enables analytics but requires consent by default', () => {
      jest.isolateModules(() => {
        const config = require('../../app/config')
        expect(config.get('analyticsEnabled')).toBe(true)
        expect(config.get('analyticsAlwaysTrack')).toBe(false)
      })
    })

    test.each([
      ['ANALYTICS_ENABLED', 'analyticsEnabled', 'true', true],
      ['ANALYTICS_ENABLED', 'analyticsEnabled', 'false', false],
      ['ANALYTICS_ALWAYS_TRACK', 'analyticsAlwaysTrack', 'true', true],
      ['ANALYTICS_ALWAYS_TRACK', 'analyticsAlwaysTrack', 'false', false]
    ])('parses %s=%s as a Boolean', (name, setting, value, expected) => {
      process.env[name] = value

      jest.isolateModules(() => {
        const config = require('../../app/config')
        expect(config.get(setting)).toBe(expected)
      })
    })
  })
})
