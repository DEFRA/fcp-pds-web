const { buildBatch, pad, dateString } = require('./helpers')

const createSFIP = (ctx) => {
  return buildBatch(ctx, 'SITIELM', 'SFIP', pad(ctx.sequence, 4), 'SFIP', (r) => [
    `H^SFIP${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^S${pad(r.invoiceNumber, 7)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFIP^Q4`,
    `L^SFIP${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80001^DRD10^S${pad(r.frn, 12)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS270`,
  ])
}

module.exports = {
  createSFIP
}
