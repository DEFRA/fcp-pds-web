const { INVALID_DATE_ERROR } = require('../constants/validation-errors')
const { MIN_DAY, MAX_DAY, MIN_MONTH, MAX_MONTH, MIN_YEAR, MAX_YEAR } = require('../constants/min-max-values')

const isValidDatePart = (value, min, max) => {
  const number = Number(value)

  return Number.isInteger(number) &&
    number >= min &&
    number <= max
}

const isValidDate = (day, month, year) => {
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
}

const addDateErrorIfRequired = (error, payload) => {
  const { day, month, year } = payload

  const dayIsValid = isValidDatePart(day, MIN_DAY, MAX_DAY)
  const monthIsValid = isValidDatePart(month, MIN_MONTH, MAX_MONTH)
  const yearIsValid = isValidDatePart(year, MIN_YEAR, MAX_YEAR)

  if (!dayIsValid || !monthIsValid || !yearIsValid || isValidDate(day, month, year)) {
    return error
  }

  const hasDateError = error.details.some(err => err.type === 'date.invalid')

  if (hasDateError) {
    return error
  }

  error.details.push({
    message: INVALID_DATE_ERROR,
    path: ['closureDate'],
    type: 'date.invalid',
    context: {
      key: 'closureDate',
      label: 'closureDate'
    }
  })

  return error
}

module.exports = {
  addDateErrorIfRequired,
  isValidDatePart,
  isValidDate
}
