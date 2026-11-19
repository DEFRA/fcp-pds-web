const config = require('../config')
const { GET } = require('../constants/api-methods')
const { STATIC_PATHS } = require('../constants/paths')

module.exports = [{
  method: GET,
  path: `${STATIC_PATHS.ASSETS}/{path*}`,
  options: {
    auth: false,
    handler: {
      directory: {
        path: [
          'node_modules/govuk-frontend/dist/govuk/assets'
        ]
      }
    },
    cache: {
      expiresIn: config.staticCacheTimeoutMillis,
      privacy: 'private'
    }
  }
}, {
  method: GET,
  path: `${STATIC_PATHS.STATIC}/{path*}`,
  options: {
    auth: false,
    handler: {
      directory: {
        path: [
          'app/dist',
          'node_modules/govuk-frontend/dist/govuk/assets',
          'node_modules/govuk-frontend/dist/govuk'
        ]
      }
    },
    cache: {
      expiresIn: config.staticCacheTimeoutMillis,
      privacy: 'private'
    }
  }
}]
