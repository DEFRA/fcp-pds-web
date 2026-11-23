const Joi = require('joi').extend(require('@joi/date'))
const { getSourceSystems } = require('ffc-pay-schemes')
const { MIN_FRN, MAX_FRN, MAX_AGREEMENT_LENGTH } = require('../../../constants/min-max-values')
const { INVALID_FRN_ERROR, NO_SCHEME_SELECTED_ERROR, INVALID_AGREEMENT_ERROR, INVALID_DATE_ERROR } = require('../../../constants/validation-errors')

const sourceSystems = getSourceSystems()

module.exports = Joi.object({
  sourceSystem: Joi.string()
    .required()
    .valid(...Object.values(sourceSystems))
    .error(errors => {
      errors.forEach(err => {
        err.message = NO_SCHEME_SELECTED_ERROR
      })
      return errors
    }),
  frn: Joi.number()
    .integer()
    .min(MIN_FRN)
    .max(MAX_FRN)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_FRN_ERROR
      })
      return errors
    }),
  agreementNumber: Joi.string()
    .required()
    .max(MAX_AGREEMENT_LENGTH)
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_AGREEMENT_ERROR
      })
      return errors
    }),
  closureDate: Joi.date()
    .format('YYYY-MM-DD')
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_DATE_ERROR
      })
      return errors
    })
})
