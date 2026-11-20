const joi = require('joi')
const ViewModel = require('./models/cookies-policy')
const { updatePolicy } = require('../cookies')
const { COOKIES_PATHS } = require('../constants/paths')
const { GET, POST } = require('../constants/api-methods')
const { COOKIES_VIEWS } = require('../constants/views')

module.exports = [
  {
    method: GET,
    path: COOKIES_PATHS.COOKIES,
    options: {
      auth: false,
      handler: (request, h) => {
        return h.view(COOKIES_VIEWS.COOKIES, new ViewModel(request.state.cookies_policy, request.query.updated))
      }
    }
  }, {
    method: POST,
    path: COOKIES_PATHS.COOKIES,
    options: {
      auth: false,
      plugins: {
        crumb: false
      },
      validate: {
        payload: joi.object({
          analytics: joi.boolean(),
          async: joi.boolean().default(false)
        })
      },
      handler: (request, h) => {
        updatePolicy(request, h, request.payload.analytics)
        if (request.payload.async) {
          return h.response('ok')
        }
        return h.redirect(`${COOKIES_PATHS.COOKIES}?updated=true`)
      }
    }
  }
]
