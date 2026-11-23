const path = require('node:path')
const nunjucks = require('nunjucks')
const config = require('../config')
const { version } = require('../../package.json')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          const env = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), ...options.path),
            'app/views',
            'node_modules/govuk-frontend/dist'
          ], {
            autoescape: true,
            watch: config.isDev
          })

          const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })
          env.addFilter('localize', (value) => numberFormat.format(value ?? 0))

          const currencyFormat = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          env.addFilter('localizeCurrency', (value) => currencyFormat.format(value ?? 0))

          const SLASH_LENGTH = 1
          env.addGlobal('getAssetPath', function (assetPath) {
            const base = options?.context?.assetPath || '/static'
            const normalizedBase = String(base).endsWith('/') ? String(base).slice(0, -SLASH_LENGTH) : String(base)
            const normalizedAsset = String(assetPath || '').startsWith('/') ? String(assetPath || '').slice(SLASH_LENGTH) : String(assetPath || '')
            return normalizedBase + (normalizedAsset ? '/' + normalizedAsset : '')
          })

          options.compileOptions.environment = env
          return next()
        }
      }
    },
    path: ['../views'],
    relativeTo: __dirname,
    isCached: !config.isDev,
    context: {
      appVersion: version,
      assetPath: '/static',
      googleAnalyticsMeasurementId: config.get('googleAnalyticsMeasurementId'),
      analyticsEnabled: config.get('analyticsEnabled'),
      analyticsAlwaysTrack: config.get('analyticsAlwaysTrack'),
      govukAssetPath: '/assets',
      serviceName: 'Payment and Document Services'
    }
  }
}
