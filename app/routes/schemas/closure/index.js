const bulkClosureSchema = require('./bulk-closure')
const removeConfirmSchema = require('./remove-confirm')
const parsedClosureSchema = require('./parsed-closure')
const closureSchema = require('./closure')

module.exports = {
  bulkClosure: bulkClosureSchema,
  removeConfirm: removeConfirmSchema,
  parsedClosure: parsedClosureSchema,
  closure: closureSchema
}
