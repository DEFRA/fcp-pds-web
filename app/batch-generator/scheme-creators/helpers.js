const os = require('node:os')

const pad = (value, width) => String(value).padStart(width, '0')
const lastDigits = (value, width) => pad(value, width).slice(-width)

const dateString = (date) => {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1, 2)
  const day = pad(date.getDate(), 2)
  return `${year}-${month}-${day}`
}

const timestampString = (date) => {
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1, 2) +
    pad(date.getDate(), 2) +
    pad(date.getHours(), 2) +
    pad(date.getMinutes(), 2) +
    pad(date.getSeconds(), 2) +
    pad(date.getMilliseconds(), 3)
  )
}

const buildBatch = (ctx, filenamePrefix, batchLabel, sequenceValue, headerLabel, rowBuilder) => {
  const lines = [
    `B^${dateString(ctx.now)}^${ctx.batchSize}^${String(ctx.batchSize * ctx.invoiceValue)}^${sequenceValue}^${headerLabel}^AP`,
  ]

  for (let i = 0; i < ctx.batchSize; i++) {
    lines.push(...rowBuilder({
      invoiceNumber: ctx.invoiceNumber + i,
      frn: ctx.frn + i,
      requestNumber: ctx.requestNumber,
      invoiceValue: ctx.invoiceValue,
      deliveryBody: ctx.deliveryBody,
      schemeYear: ctx.schemeYear,
    }))
  }

  const filename = `${filenamePrefix}${pad(ctx.sequence, 4)}_AP_${timestampString(ctx.now)}.dat`

  return { filename, content: lines.join(os.EOL) + os.EOL }
}

module.exports = {
  pad,
  lastDigits,
  buildBatch,
  dateString,
  timestampString
}
