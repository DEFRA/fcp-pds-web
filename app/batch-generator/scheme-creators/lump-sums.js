const { buildBatch, pad, dateString } = require('./helpers')

const createLS = (ctx) => {
  return buildBatch(ctx, 'SITILSES', 'LSES', ctx.sequence, 'LSES', (r) => [
    `H^LSES${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 3)}^L${pad(r.invoiceNumber, 7)}^${r.frn}^1^${String(r.invoiceValue)}^${r.deliveryBody}^GBP`,
    `L^LSES${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^10570^DOM10^${r.deliveryBody}^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 10, 1))}`,
  ])
}

module.exports = {
  createLS
}
