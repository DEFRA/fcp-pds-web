const Joi = require('joi')

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
  schemeId: Joi.string().required().messages({
    'string.empty': 'Select a scheme',
    'any.required': 'Select a scheme'
  }),
  sequence: numericField(
    'Enter a sequence number',
    'Sequence number must contain numbers only'
  ),
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
  invoiceNumber: numericField(
    'Enter the first invoice number',
    'First invoice number must contain numbers only'
  ),
  frn: numericField(
    'Enter the first FRN',
    'First FRN must contain numbers only'
  ),
  marketingYear: numericField(
    'Enter a marketing year',
    'Marketing year must contain numbers only'
  )
})
