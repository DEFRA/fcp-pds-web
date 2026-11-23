const Joi = require('joi')
const { isValidDatePart, isValidDate } = require('../../../helpers')
const { MIN_FRN, MAX_FRN, MAX_AGREEMENT_LENGTH, MIN_DAY, MAX_DAY, MIN_MONTH, MAX_MONTH, MIN_YEAR, MAX_YEAR } = require('../../../constants/min-max-values')
const { INVALID_DATE_ERROR, INVALID_FRN_ERROR, INVALID_AGREEMENT_ERROR, NO_SCHEME_SELECTED_ERROR, INVALID_DAY_ERROR, INVALID_MONTH_ERROR, INVALID_YEAR_ERROR } = require('../../../constants/validation-errors')

module.exports = Joi.object({
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
  agreement: Joi.string()
    .required()
    .max(MAX_AGREEMENT_LENGTH)
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_AGREEMENT_ERROR
      })
      return errors
    }),
  schemeId: Joi.number()
    .integer()
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = NO_SCHEME_SELECTED_ERROR
      })
      return errors
    }),
  day: Joi.number()
    .integer()
    .min(MIN_DAY)
    .max(MAX_DAY)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_DAY_ERROR
      })
      return errors
    }),
  month: Joi.number()
    .integer()
    .min(MIN_MONTH)
    .max(MAX_MONTH)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_MONTH_ERROR
      })
      return errors
    }),
  year: Joi.number()
    .integer()
    .min(MIN_YEAR)
    .max(MAX_YEAR)
    .required()
    .error(errors => {
      errors.forEach(err => {
        err.message = INVALID_YEAR_ERROR
      })
      return errors
    })
}).custom((value, helpers) => {
  const { day, month, year } = value

  const dayIsValid = isValidDatePart(day, MIN_DAY, MAX_DAY)
  const monthIsValid = isValidDatePart(month, MIN_MONTH, MAX_MONTH)
  const yearIsValid = isValidDatePart(year, MIN_YEAR, MAX_YEAR)

  if (!dayIsValid || !monthIsValid || !yearIsValid) {
    return value
  }

  if (!isValidDate(day, month, year)) {
    return helpers.error('date.invalid')
  }

  return value
}).messages({
  'date.invalid': INVALID_DATE_ERROR
})
