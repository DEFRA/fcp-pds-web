const { buildBatch, pad, lastDigits } = require('./helpers')

const createCOHTC = (ctx) => {
  return buildBatch(ctx, 'SITICOHTC', 'SITICOHTC', pad(ctx.sequence, 4), 'SITICOHTC', (r) => [
    `H^SITICOHTC${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^Z${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SITICOHTC^`,
    `L^SITICOHTC${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^Z${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^SOS270`,
  ])
}

module.exports = {
  createCOHTC
}
