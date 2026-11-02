const { buildBatch, pad, dateString } = require('./helpers')

const invoiceNumberPad = 7
const requestNumberPad = 3
const contractNumberPad = 7
const novemberMonth = 10
const firstDayOfMonth = 1

const createLS = (ctx) => {
  return buildBatch(ctx, 'SITILSES', 'LSES', ctx.sequence, 'LSES', (r) => [
    `H^LSES${pad(r.invoiceNumber, invoiceNumberPad)}^${pad(r.requestNumber, requestNumberPad)}^L${pad(r.invoiceNumber, contractNumberPad)}^${r.frn}^1^${String(r.invoiceValue)}^${r.deliveryBody}^GBP`,
    `L^LSES${pad(r.invoiceNumber, invoiceNumberPad)}^${String(r.invoiceValue)}^${r.schemeYear}^10570^${r.fundCode}^${r.deliveryBody}^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, novemberMonth, firstDayOfMonth))}`
  ])
}

module.exports = {
  createLS
}
