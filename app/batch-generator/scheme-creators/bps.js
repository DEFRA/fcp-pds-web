const { buildBatch, pad, dateString } = require('./helpers')

const createBPS = (ctx) => {
  return buildBatch(ctx, 'SITI_', 'SITI AGRI SYS', ctx.sequence, 'SITI AGRI SYS', (r) => [
    `H^SITI${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 3)}^C${pad(r.invoiceNumber, 7)}^${r.frn}^1^${String(r.invoiceValue)}^${r.deliveryBody}^GBP`,
    `L^SITI${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^10501^EGF00^${r.deliveryBody}^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}`,
  ])
}

module.exports = {
  createBPS
}
