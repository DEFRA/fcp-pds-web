const convict = require('convict')
const convictFormatWithValidator = require('convict-format-with-validator')
const authConfig = require('./config/auth')

convict.addFormats(convictFormatWithValidator)

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
  authConfig
}
