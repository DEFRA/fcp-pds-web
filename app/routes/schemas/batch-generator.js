const Joi = require('joi')
const { getSchemeIds } = require('ffc-pay-schemes')
const { getBatchSchemes } = require('../../helpers/get-batch-schemes')

const { CS } = getSchemeIds()
const validSchemeIds = getBatchSchemes().map((scheme) => String(scheme.schemeId))

const numericField = (requiredMessage, formatMessage) =>
  Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.empty': requiredMessage,
      'any.required': requiredMessage,
      'string.pattern.base': formatMessage
    })

module.exports = Joi.object({
  schemeId: Joi.string()
    .required()
    .valid(...validSchemeIds)
    .messages({
      'string.empty': 'Select a scheme',
      'any.required': 'Select a scheme',
      'any.only': 'Select a valid scheme'
    }),

  sequence: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .custom((value, helpers) => {
      const payload = helpers.state.ancestors[0]
      const sequence = Number(value)
      const schemeId = Number(payload.schemeId)
      const maxSequence = schemeId === CS ? 99999 : 9999

      if (!Number.isInteger(sequence) || sequence < 1 || sequence > maxSequence) {
        return helpers.message(`Sequence must be between 1 and ${maxSequence}`)
      }

      return value
    })
    .messages({
      'string.empty': 'Enter a sequence number',
      'any.required': 'Enter a sequence number',
      'string.pattern.base': 'Sequence number must contain numbers only'
    }),

  numberOfPR: numericField(
    'Enter the number of payment requests',
    'Number of payment requests must contain numbers only'
  ),

  value: numericField(
    'Enter the value of the payment requests in pence',
    'Value must contain numbers only'
  ),

  prn: numericField(
    'Enter a payment request number',
    'Payment request number must contain numbers only'
  ),

  invoiceNumber: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .custom((value, helpers) => {
      const invoiceNumber = Number(value)
      if (!Number.isInteger(invoiceNumber) || invoiceNumber < 1) {
        return helpers.message('Invoice number must be a positive integer')
      }
      return value
    })
    .messages({
      'string.empty': 'Enter the first invoice number',
      'any.required': 'Enter the first invoice number',
      'string.pattern.base': 'First invoice number must contain numbers only'
    }),

  frn: Joi.string()
    .pattern(/^\d+$/)
    .length(10)
    .required()
    .custom((value, helpers) => {
      const payload = helpers.state.ancestors[0]
      const frn = Number(value)
      const maxFrn = 10000000000 - Number(payload.numberOfPR || 0)

      if (frn < 1000000000 || frn > maxFrn) {
        return helpers.message(
          `FRN must be between 1000000000 and ${maxFrn}`
        )
      }

      return value
    })
    .messages({
      'string.empty': 'Enter the first FRN',
      'any.required': 'Enter the first FRN',
      'string.pattern.base': 'First FRN must contain numbers only',
      'string.length': 'FRN must be 10 digits'
    }),

  marketingYear: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .custom((value, helpers) => {
      const year = Number(value)
      if (!Number.isInteger(year) || year < 1993 || year > 2099) {
        return helpers.message('Marketing year must be between 1993 and 2099')
      }
      return value
    })
    .messages({
      'string.empty': 'Enter a marketing year',
      'any.required': 'Enter a marketing year',
      'string.pattern.base': 'Marketing year must contain 4 numbers only'
    }),

  createChecksum: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .required()
    .messages({
      'boolean.base': 'Select whether to create a checksum file',
      'any.required': 'Select whether to create a checksum file'
    }),

  createControl: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .required()
    .messages({
      'boolean.base': 'Select whether to create a control file',
      'any.required': 'Select whether to create a control file'
    })
})
