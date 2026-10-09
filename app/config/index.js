const convict = require('convict')
const convictFormatWithValidator = require('convict-format-with-validator')
const authConfig = require('./auth')

convict.addFormats(convictFormatWithValidator)
const Millseconds = 1000
const seconds = 60
const minutes = 60
const hours = 24
const daysPerYear = 365

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  isDev: {
    doc: 'True if the application is in development mode.',
    format: Boolean,
    default: process.env.NODE_ENV === 'development'
  },
  serviceName: {
    doc: 'The name of the service.',
    format: String,
    default: 'Payments and Documents Services',
    env: 'SERVICE_NAME'
  },
  host: {
    doc: 'The host to bind.',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3023,
    env: 'PORT',
    arg: 'port'
  },
  staticCacheTimeoutMillis: {
    doc: 'Cache timeout for static assets in milliseconds.',
    format: Number,
    default: 604800000,
    env: 'STATIC_CACHE_TIMEOUT_MILLIS'
  },

  paymentsEndpoint: {
    doc: 'Payments service endpoint',
    format: String,
    default: '',
    env: 'PAYMENTS_SERVICE_ENDPOINT'
  },
  trackingEndpoint: {
    doc: 'Tracking service endpoint',
    format: String,
    default: '',
    env: 'TRACKING_SERVICE_ENDPOINT'
  },
  injectionEndpoint: {
    doc: 'Injection service endpoint',
    format: String,
    default: '',
    env: 'INJECTION_SERVICE_ENDPOINT'
  },
  alertingEndpoint: {
    doc: 'Alerting service endpoint',
    format: String,
    default: '',
    env: 'ALERTING_SERVICE_ENDPOINT'
  },
  statementPublisherEndpoint: {
    doc: 'Statement publisher endpoint',
    format: String,
    default: '',
    env: 'STATEMENT_PUBLISHER_ENDPOINT'
  },
  retentionEndpoint: {
    doc: 'Retention service endpoint',
    format: String,
    default: '',
    env: 'RETENTION_ENDPOINT'
  },
  batchProcessorEndpoint: {
    doc: 'Batch Processor service endpoint',
    format: String,
    default: '',
    env: 'BATCH_PROCESSOR_ENDPOINT'
  }
})

config.validate({ allowed: 'strict' })

// Attach auth config
const configWithAuth = config.getProperties()
configWithAuth.authConfig = authConfig

module.exports = {
  get: config.get.bind(config),
  getProperties: config.getProperties.bind(config),
  has: config.has.bind(config),
  validate: config.validate.bind(config),
  isDev: config.get('isDev'),
  authConfig,
  cookieOptions: {
    ttl: Millseconds * seconds * minutes * hours * daysPerYear,
    isSameSite: 'Lax',
    encoding: 'base64json',
    isSecure: process.env.NODE_ENV === 'production',
    isHttpOnly: true,
    clearInvalid: false,
    strictHeader: true
  }
}
