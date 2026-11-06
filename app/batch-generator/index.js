const path = require('node:path')
const crypto = require('node:crypto')
const { getSchemeIds, getDeliveryBodyFromSchemeId, getFundCodeFromSchemeId } = require('ffc-pay-schemes')
const { createBatchContent } = require('./create-batch-content')

const { CS } = getSchemeIds()
const defaultOne = 1
const defaultValue = 100
const defaultFRN = 1000000001

const getDeliveryBody = (options, schemeId) => {
  if (options.deliveryBody) {
    return options.deliveryBody
  }

  const schemeDeliveryBody = getDeliveryBodyFromSchemeId(Number(schemeId))
  if (schemeDeliveryBody) {
    return schemeDeliveryBody
  }

  return Number(schemeId) === CS ? 'NE00' : 'RP00'
}

const getBatchContext = (options = {}) => {
  const now = new Date()

  return {
    ...options,
    now,
    batchSize: Number(options.batchSize ?? defaultOne),
    invoiceValue: Number(options.invoiceValue ?? defaultValue),
    sequence: Number(options.sequence ?? defaultOne),
    requestNumber: Number(options.requestNumber ?? defaultOne),
    invoiceNumber: Number(options.invoiceNumber ?? defaultOne),
    frn: Number(options.frn ?? defaultFRN),
    schemeYear: Number(options.schemeYear ?? now.getFullYear()),
    deliveryBody: getDeliveryBody(options, options.schemeId),
    fundCode: getFundCodeFromSchemeId(Number(options.schemeId)) ?? 'DRD10'
  }
}

const validateBatchSize = (batchSize) => {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('batchSize must be a positive integer')
  }
}

const getChecksumFilename = (filename) => `${path.basename(filename, path.extname(filename))}.txt`

const createFiles = (result, options) => {
  const files = [{ filename: result.filename, content: result.content }]
  const checksumFilename = getChecksumFilename(result.filename)

  if (options.createChecksum) {
    files.push({
      filename: checksumFilename,
      content: crypto
        .createHash('sha256')
        .update(result.content, 'utf8')
        .digest('hex')
    })
  }

  if (!options.createControl) {
    return files
  }

  files.push({ filename: `CTL_${path.basename(result.filename)}`, content: '' })

  if (options.createChecksum) {
    files.push({ filename: `CTL_${checksumFilename}`, content: '' })
  }

  return files
}

const generateBatch = (options = {}) => {
  const ctx = getBatchContext(options)
  validateBatchSize(ctx.batchSize)

  const result = createBatchContent(ctx)
  return createFiles(result, options)
}

module.exports = {
  generateBatch
}
