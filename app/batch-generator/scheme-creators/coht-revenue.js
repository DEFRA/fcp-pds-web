const { buildBatch, pad, lastDigits, dateString } = require('./helpers')

const createCOHTR = (ctx) => {
  return buildBatch(ctx, 'ESFIO', 'COHTR', pad(ctx.sequence, 4), 'COHTR', (r) => [
    `H^ESFIO${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^Z${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^COHTR^Q4`,
    `L^ESFIO${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^Z${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS270`,
  ])
}

module.exports = {
  createCOHTR
}
