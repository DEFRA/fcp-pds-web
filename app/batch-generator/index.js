const path = require('node:path')
const crypto = require('node:crypto')
const { getSitiAgriSchemeIds } = require('ffc-pay-schemes')
const { createBatchContent } = require('./create-batch-content')

const { CS } = getSitiAgriSchemeIds()

const generateBatch = (options) => {
  const now = new Date()
  const ctx = {
    ...options,
    now,
    batchSize: Number(options.batchSize ?? 1),
    invoiceValue: Number(options.invoiceValue ?? 100),
    sequence: Number(options.sequence ?? 1),
    requestNumber: Number(options.requestNumber ?? 1),
    invoiceNumber: Number(options.invoiceNumber ?? 1),
    frn: Number(options.frn ?? 1000000001),
    schemeYear: Number(options.schemeYear ?? now.getFullYear()),
    deliveryBody: options.deliveryBody ?? (
      options.schemeId === CS ? 'NE00' : 'RP00'
    )
  }

  if (!Number.isInteger(ctx.batchSize) || ctx.batchSize < 1) {
    throw new Error('batchSize must be a positive integer')
  }

  const result = createBatchContent(ctx)
  const files = [{ filename: result.filename, content: result.content }]

  if (options.createChecksum) {
    const checksumFilename = `${path.basename(result.filename, path.extname(result.filename))}.txt`
    const checksum = crypto
      .createHash('sha256')
      .update(result.content, 'utf8')
      .digest('hex')

    files.push({ filename: checksumFilename, content: checksum })
  }

  if (options.createControl) {
    files.push({ filename: `CTL_${path.basename(result.filename)}`, content: '' })

    if (options.createChecksum) {
      const checksumFilename = `${path.basename(result.filename, path.extname(result.filename))}.txt`
      files.push({ filename: `CTL_${checksumFilename}`, content: '' })
    }
  }

  return files
}

module.exports = {
  generateBatch
}
