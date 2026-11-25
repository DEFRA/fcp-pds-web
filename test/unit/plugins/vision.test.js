jest.mock('../../../app/config', () => ({
  isDev: false,
  get: jest.fn(setting => ({
    googleAnalyticsMeasurementId: 'G-TEST12345',
    analyticsEnabled: true,
    analyticsAlwaysTrack: false
  })[setting])
}))

const visionPlugin = require('../../../app/plugins/vision')
const nunjucks = require('nunjucks')
const { version } = require('../../../package.json')
const config = require('../../../app/config')

describe('vision plugin', () => {
  afterEach(() => {
    config.isDev = false
  })

  describe('plugin structure', () => {
    test('exports @hapi/vision plugin', () => {
      expect(visionPlugin.plugin).toBeDefined()
      expect(visionPlugin.plugin).toBe(require('@hapi/vision'))
    })

    test('exports plugin options', () => {
      expect(visionPlugin.options).toBeDefined()
      expect(typeof visionPlugin.options).toBe('object')
    })

    test('options have engines configuration', () => {
      expect(visionPlugin.options.engines).toBeDefined()
      expect(visionPlugin.options.engines.njk).toBeDefined()
    })

    test('options have path configuration', () => {
      expect(visionPlugin.options.path).toBeDefined()
      expect(Array.isArray(visionPlugin.options.path)).toBe(true)
      expect(visionPlugin.options.path).toContain('../views')
    })

    test('options have context configuration', () => {
      expect(visionPlugin.options.context).toBeDefined()
      expect(visionPlugin.options.context.appVersion).toBe(version)
      expect(visionPlugin.options.context.assetPath).toBe('/static')
      expect(visionPlugin.options.context.googleAnalyticsMeasurementId).toBe('G-TEST12345')
      expect(config.get).toHaveBeenCalledWith('googleAnalyticsMeasurementId')
      expect(visionPlugin.options.context.analyticsEnabled).toBe(true)
      expect(config.get).toHaveBeenCalledWith('analyticsEnabled')
      expect(visionPlugin.options.context.analyticsAlwaysTrack).toBe(false)
      expect(config.get).toHaveBeenCalledWith('analyticsAlwaysTrack')
      expect(visionPlugin.options.context.govukAssetPath).toBe('/assets')
      expect(visionPlugin.options.context.serviceName).toBe('Payment and Document Services')
    })

    test('relativeTo is set to __dirname', () => {
      expect(visionPlugin.options.relativeTo).toBeDefined()
    })
  })

  describe('nunjucks engine compile function', () => {
    let compileFunc
    let options

    beforeEach(() => {
      compileFunc = visionPlugin.options.engines.njk.compile
      options = {
        environment: new nunjucks.Environment()
      }
    })

    test('compile returns a function', () => {
      const src = '<p>{{ greeting }}</p>'
      const result = compileFunc(src, options)
      expect(typeof result).toBe('function')
    })

    test('compile renders template with context', () => {
      const src = '<p>{{ greeting }} {{ name }}</p>'
      const result = compileFunc(src, options)
      const output = result({ greeting: 'Hello', name: 'World' })
      expect(output).toContain('Hello')
      expect(output).toContain('World')
    })

    test('compile handles empty context', () => {
      const src = '<p>Static content</p>'
      const result = compileFunc(src, options)
      const output = result({})
      expect(output).toContain('Static content')
    })

    test('compile handles conditional logic', () => {
      const src = '{% if show %}<p>Visible</p>{% endif %}'
      const result = compileFunc(src, options)
      const output1 = result({ show: true })
      const output2 = result({ show: false })
      expect(output1).toContain('Visible')
      expect(output2).not.toContain('Visible')
    })

    test('compile handles loops', () => {
      const src = '{% for item in items %}<li>{{ item }}</li>{% endfor %}'
      const result = compileFunc(src, options)
      const output = result({ items: ['a', 'b', 'c'] })
      expect(output).toContain('<li>a</li>')
      expect(output).toContain('<li>b</li>')
      expect(output).toContain('<li>c</li>')
    })
  })

  describe('nunjucks engine prepare function', () => {
    let prepareFunc
    let mockNext
    let testOptions

    beforeEach(() => {
      prepareFunc = visionPlugin.options.engines.njk.prepare
      mockNext = jest.fn()
      testOptions = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
    })

    test('prepare calls next callback', async () => {
      await prepareFunc(testOptions, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    test('prepare sets up nunjucks environment', async () => {
      await prepareFunc(testOptions, mockNext)
      expect(testOptions.compileOptions.environment).toBeDefined()
      expect(testOptions.compileOptions.environment instanceof require('nunjucks').Environment).toBe(true)
    })

    test.each([
      ['mixed', ['payment_alert'], ['scheme_added'], ['Scheme One scheme alerts', 'New scheme alerts']],
      ['scheme only', ['payment_alert'], [], ['Scheme One scheme alerts']],
      ['global only', [], ['scheme_added'], ['New scheme alerts']]
    ])('renders separate confirmation cards for %s selections', (_description, alertTypes, globalAlertTypes, titles) => {
      prepareFunc(testOptions, mockNext)
      const { environment } = testOptions.compileOptions
      const loader = environment.loaders[0]
      const getSource = loader.getSource.bind(loader)
      loader.getSource = name => name === '_layout.njk'
        ? { src: '{% block beforeContent %}{% endblock %}{% block content %}{% endblock %}', path: name }
        : getSource(name)

      const html = environment.render('alerts/update-confirm.njk', {
        contactId: 12,
        emailAddress: 'person@example.com',
        action: 'edit',
        formPath: '/alerts/update',
        schemes: [{ schemeId: 1, schemeName: 'Scheme One', alertTypes }],
        globalAlertTypes,
        formatAlertType: value => value
      })
      const cards = html.split('<div class="govuk-summary-card">').slice(1)

      expect(cards.map(card => card.match(/class="govuk-summary-card__title">([^<]+)/)[1])).toEqual(titles)
      if (titles.length === 2) {
        expect(cards[0]).toContain('<li>payment_alert</li>')
        expect(cards[0]).not.toContain('<li>scheme_added</li>')
        expect(cards[1]).toContain('<li>scheme_added</li>')
        expect(cards[1]).not.toContain('<li>payment_alert</li>')
        const links = [...html.matchAll(/href="(\/alerts\/update\?[^"]+)"/g)]
        expect(links).toHaveLength(3)
        for (const [, link] of links) {
          expect(link).toContain('&amp;contactId=12&amp;1=payment_alert&amp;globalAlerts=scheme_added')
        }
      }
    })

    test.each(['update-confirm', 'add-recipient-by-scheme-confirm'])('renders the new recipient card title in %s', (template) => {
      prepareFunc(testOptions, mockNext)
      const { environment } = testOptions.compileOptions
      const loader = environment.loaders[0]
      const getSource = loader.getSource.bind(loader)
      loader.getSource = name => name === '_layout.njk'
        ? { src: '{% block beforeContent %}{% endblock %}{% block content %}{% endblock %}', path: name }
        : getSource(name)

      const html = environment.render(`alerts/${template}.njk`, {
        action: 'create',
        emailAddress: 'person@example.com',
        formPath: '/alerts/update',
        schemeId: 1,
        schemeName: 'Scheme One',
        schemes: [],
        globalAlertTypes: []
      })

      expect(html).toMatch(/class="govuk-summary-card__title">\s*New alert recipient\s*<\/h2>/)
    })

    test('prepare configures autoescape', async () => {
      await prepareFunc(testOptions, mockNext)
      const env = testOptions.compileOptions.environment
      expect(env.opts.autoescape).toBe(true)
    })

    test.each([
      [1234, '1,234'],
      [1234.56, '1,234.56'],
      [undefined, '0']
    ])('localize renders %s as %s', (value, expected) => {
      prepareFunc(testOptions, mockNext)
      const env = testOptions.compileOptions.environment
      expect(env.renderString('{{ value | localize }}', { value })).toBe(expected)
    })

    test.each([
      [1234.5, '1,234.50'],
      [1234.567, '1,234.57'],
      [undefined, '0.00']
    ])('localizeCurrency renders %s as %s', (value, expected) => {
      prepareFunc(testOptions, mockNext)
      const env = testOptions.compileOptions.environment
      expect(env.renderString('{{ value | localizeCurrency }}', { value })).toBe(expected)
    })

    test('prepare respects isDev config for watch setting', async () => {
      // Ensure isDev is false before this test
      config.isDev = false
      await prepareFunc(testOptions, mockNext)
      const env = testOptions.compileOptions.environment
      // When isDev is false, watch should be false
      expect(env.opts.watch).toBe(false)
    })

    test('prepare respects isDev config for watch setting when isDev is true', async () => {
      config.isDev = true
      const freshOptions = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
      await prepareFunc(freshOptions, jest.fn())
      const env = freshOptions.compileOptions.environment
      expect(env.opts.watch).toBe(true)
    })

    test('prepare adds getAssetPath global function', async () => {
      await prepareFunc(testOptions, mockNext)
      const env = testOptions.compileOptions.environment
      expect(env.globals.getAssetPath).toBeDefined()
      expect(typeof env.globals.getAssetPath).toBe('function')
    })
  })

  describe('getAssetPath global function', () => {
    let prepareFunc
    let testOptions

    beforeEach(() => {
      prepareFunc = visionPlugin.options.engines.njk.prepare
      testOptions = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
    })

    const getAssetPathFromOptions = async (options) => {
      await prepareFunc(options, jest.fn())
      return options.compileOptions.environment.globals.getAssetPath
    }

    test('getAssetPath builds path with base and asset', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/static/css/style.css')
    })

    test('getAssetPath handles leading slash in asset path', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('/css/style.css')
      expect(result).toBe('/static/css/style.css')
    })

    test('getAssetPath handles trailing slash in base path - removes it', async () => {
      testOptions.context.assetPath = '/static/'
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/static/css/style.css')
    })

    test('getAssetPath returns base when asset is empty', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('')
      expect(result).toBe('/static')
    })

    test('getAssetPath returns base when asset is null', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath(null)
      expect(result).toBe('/static')
    })

    test('getAssetPath returns base when asset is undefined', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath(undefined)
      expect(result).toBe('/static')
    })

    test('getAssetPath removes trailing slash from base', async () => {
      testOptions.context.assetPath = '/static/'
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('')
      expect(result).toBe('/static')
    })

    test('getAssetPath uses context assetPath when provided', async () => {
      testOptions.context.assetPath = '/assets'
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('js/app.js')
      expect(result).toBe('/assets/js/app.js')
    })

    test('getAssetPath handles nested paths', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/vendor/bootstrap.css')
      expect(result).toBe('/static/css/vendor/bootstrap.css')
    })

    test('getAssetPath handles single file names', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('favicon.ico')
      expect(result).toBe('/static/favicon.ico')
    })

    test('getAssetPath with empty string returns base only', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('')
      expect(result).toBe('/static')
    })

    test('getAssetPath with false value returns base', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath(false)
      expect(result).toBe('/static')
    })

    test('getAssetPath with zero returns base', async () => {
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath(0)
      expect(result).toBe('/static')
    })

    test('getAssetPath with slash-only base builds correct path', async () => {
      testOptions.context.assetPath = '/'
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/css/style.css')
    })

    test('getAssetPath with multiple trailing slashes in base', async () => {
      testOptions.context.assetPath = '/static/'
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/static/css/style.css')
    })

    test('getAssetPath with empty base uses default', async () => {
      testOptions.context = {}
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/static/css/style.css')
    })

    test('getAssetPath with null base uses default', async () => {
      testOptions.context.assetPath = null
      const getAssetPath = await getAssetPathFromOptions(testOptions)
      const result = getAssetPath('css/style.css')
      expect(result).toBe('/static/css/style.css')
    })
  })

  describe('cache configuration', () => {
    test('options has isCached property', () => {
      expect('isCached' in visionPlugin.options).toBe(true)
      expect(typeof visionPlugin.options.isCached).toBe('boolean')
    })

    test('isDev config affects template caching behavior when false', async () => {
      config.isDev = false
      const prepareFunc = visionPlugin.options.engines.njk.prepare
      const testOptions = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
      await prepareFunc(testOptions, jest.fn())
      const env = testOptions.compileOptions.environment
      expect(env.opts.watch).toBe(false)
    })

    test('isDev config affects template caching behavior when true', async () => {
      config.isDev = true
      const prepareFunc = visionPlugin.options.engines.njk.prepare
      const testOptions = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
      await prepareFunc(testOptions, jest.fn())
      const env = testOptions.compileOptions.environment
      expect(env.opts.watch).toBe(true)
    })
  })

  describe('template rendering integration', () => {
    let compileFunc
    let prepareFunc
    let options
    let env

    beforeEach(async () => {
      compileFunc = visionPlugin.options.engines.njk.compile
      prepareFunc = visionPlugin.options.engines.njk.prepare
      options = {
        relativeTo: '/test/path',
        path: ['views'],
        context: { assetPath: '/static' },
        compileOptions: {}
      }
      await prepareFunc(options, jest.fn())
      env = options.compileOptions.environment
    })

    test('can render template with variable substitution', () => {
      const src = '<p>{{ message }}</p>'
      const compiledTemplate = compileFunc(src, options)
      const output = compiledTemplate({ message: 'Hello World' })
      expect(output).toContain('Hello World')
    })

    test('renders all metrics counts and currency amounts', () => {
      env.loaders.unshift({
        cache: {},
        getSource: (name) => name === '_layout.njk'
          ? { src: '{% block content %}{% endblock %}', path: name }
          : null
      })

      const output = env.render('metrics/metrics.njk', {
        selectedPeriod: 'all',
        paymentsMetrics: {
          totalPayments: 3456,
          totalValue: 234550,
          totalPendingPayments: 1234,
          totalProcessedPayments: 2222,
          paymentsByScheme: [{
            schemeName: 'Test scheme',
            schemeYear: 2026,
            totalPayments: 3456,
            totalValue: 234550,
            paymentsByStatus: { pending: 1234, processed: 2222 }
          }]
        },
        statementsMetrics: {
          totalStatements: 6789,
          totalPrintPost: 2345,
          totalPrintPostCost: 345600,
          totalEmail: 4444,
          statementsByScheme: [{
            schemeName: 'Test scheme',
            schemeYear: 2026,
            totalStatements: 6789,
            printPostCount: 2345,
            printPostCost: 345600,
            emailCount: 4444
          }]
        }
      })

      const panelValues = Array.from(output.matchAll(/<div class="govuk-panel__body metrics-panel__body">\s*([^<]*?)\s*<\/div>/g), ([, value]) => value.replace(/£\s+/, '£'))
      const tableValues = Array.from(output.matchAll(/class="govuk-table__cell govuk-table__cell--numeric[^"]*">\s*([^<]*?)\s*<\/td>/g), ([, value]) => value)

      expect(panelValues).toEqual(['3,456', '£2,345.50', '6,789'])
      expect(tableValues).toEqual([
        '3,456', '2,345.50', '1,234', '2,222',
        '3,456', '2,345.50', '1,234', '2,222',
        '6,789', '2,345', '3,456.00', '4,444',
        '6,789', '2,345', '3,456.00', '4,444'
      ])
    })

    test('getAssetPath is available as global in environment', () => {
      expect(env.globals.getAssetPath).toBeDefined()
      expect(typeof env.globals.getAssetPath).toBe('function')
    })

    test('getAssetPath global function works with templates when passed as context', () => {
      const src = '<link href="{{ assetUrl }}" />'
      const compiledTemplate = compileFunc(src, options)
      const assetUrl = env.globals.getAssetPath('css/main.css')
      const output = compiledTemplate({ assetUrl })
      expect(output).toContain('/static/css/main.css')
    })

    test('template with autoescape protects against XSS', () => {
      const src = '<p>{{ content }}</p>'
      const compiledTemplate = compileFunc(src, options)
      const maliciousContent = '<script>alert("xss")</script>'
      const output = compiledTemplate({ content: maliciousContent })
      expect(output).not.toContain('<script>')
      expect(output).toContain('&lt;script&gt;')
    })

    test('template can use multiple context variables', () => {
      const src = '<h1>{{ title }}</h1><p>{{ description }}</p>'
      const compiledTemplate = compileFunc(src, options)
      const output = compiledTemplate({ title: 'Test', description: 'Testing' })
      expect(output).toContain('Test')
      expect(output).toContain('Testing')
    })
  })
})
