const { CLOSURE_VIEWS } = require('../constants/views')
const { BAD_REQUEST } = require('../constants/http-status-codes')

const handleBulkClosureError = (h, error, crumb) => {
  const errorDetails = typeof error === 'string'
    ? { details: [{ message: error }] }
    : error

  return h
    .view(CLOSURE_VIEWS.BULK, { errors: errorDetails, crumb })
    .code(BAD_REQUEST)
    .takeover()
}

module.exports = {
  handleBulkClosureError
}
