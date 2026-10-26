const { buildBatch, pad, dateString } = require('./helpers')

const createCS = (ctx) => {
  return buildBatch(ctx, 'SITICS', 'SITI AGRI CS SYS', ctx.sequence, 'SITI AGRI CS SYS', (r) => [
    `H^CS${pad(r.invoiceNumber, 9)}^${pad(r.requestNumber, 3)}^A${pad(r.invoiceNumber, 7)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^NE00^GBP`,
    `L^CS${pad(r.invoiceNumber, 9)}^${String(r.invoiceValue)}^${r.schemeYear}^5704A^ERD14^A${pad(r.frn, 11)}/MT^NE00^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^SOS273`,
  ])
}

module.exports = {
  createCS
}
