const { SOURCE_SYSTEM_INDEX, FRN_INDEX, AGREEMENT_NUMBER_INDEX, CLOSURE_DATE_INDEX } = require('../constants/closure-indexes')
const { UNEXPECTED_FILE_FORMAT_ERROR } = require('../constants/validation-errors')
const { MAX_CLOSURE_DATA_LENGTH } = require('../constants/min-max-values')
const { parsedClosure } = require('../routes/schemas/closure')

const processClosureData = async (data) => {
  const uploadData = []
  const splitData = data.split(/\r?\n|\r|\n/g)
  const closureLines = splitData.filter((str) => str !== '')
  for (const closureLine of closureLines) {
    const clData = closureLine.split(',')
    if (clData.length !== MAX_CLOSURE_DATA_LENGTH) {
      return {
        errors: { details: [{ message: UNEXPECTED_FILE_FORMAT_ERROR }] }
      }
    } else {
      const parsedData = {
        sourceSystem: clData[SOURCE_SYSTEM_INDEX],
        frn: clData[FRN_INDEX],
        agreementNumber: clData[AGREEMENT_NUMBER_INDEX],
        closureDate: clData[CLOSURE_DATE_INDEX]
      }
      const result = parsedClosure.validate(parsedData, {
        abortEarly: false
      })
      if (result.error) {
        return {
          errors: result.error
        }
      } else {
        uploadData.push(parsedData)
      }
    }
  }
  return {
    uploadData
  }
}

module.exports = {
  processClosureData
}
