const { MIN_SEQUENCE_NUMBER, MAX_SEQUENCE_NUMBER_CS, MAX_SEQUENCE_NUMBER } = require('./min-max-values')
const { MAX_MEGA_BYTES } = require('./payload-sizes')

module.exports = {
  BULK_UPLOAD_ERROR: 'An error occurred whilst processing the bulk upload',
  CLOSURE_EXISTS_ERROR: 'A closure already exists for the selected FRN, agreement number and scheme. In order to update this, please remove the existing record',
  EMPTY_FILE_ERROR: 'File is empty or could not be read',
  EMAIL_DOMAIN_NOT_ALLOWED: 'The email address is not allowed. Please contact the Payment & Document Services team if you believe this is a mistake.',
  FILE_TOO_LARGE_ERROR: `The uploaded file is too large. Please upload a file smaller than ${MAX_MEGA_BYTES} MB.`,
  INVALID_AGREEMENT_ERROR: 'Enter a valid agreement number',
  INVALID_CSV_ERROR: 'Provide a CSV file',
  INVALID_DATE_ERROR: 'Enter a valid date',
  INVALID_DAY_ERROR: 'Enter a valid day',
  INVALID_FRN_ERROR: 'Enter a 10-digit FRN',
  INVALID_MONTH_ERROR: 'Enter a valid month',
  INVALID_SEQUENCE_CS_ERROR: `Sequence number must be between ${MIN_SEQUENCE_NUMBER} and ${MAX_SEQUENCE_NUMBER_CS}`,
  INVALID_SEQUENCE_ERROR: `Sequence number must be between ${MIN_SEQUENCE_NUMBER} and ${MAX_SEQUENCE_NUMBER}`,
  INVALID_YEAR_ERROR: 'Enter a valid year',
  NO_DATA_ERROR: 'No data was found for the selected report criteria. Please review your filters, such as date range or report type, and try again',
  NO_SCHEME_SELECTED_ERROR: 'Select a scheme',
  SEQUENCE_TOO_LOW_ERROR: `Sequence number must be a whole number greater than or equal to ${MIN_SEQUENCE_NUMBER}`,
  UNEXPECTED_FILE_FORMAT_ERROR: 'The file is not in the expected format'
}
