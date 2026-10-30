const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const createSFI23 = (ctx) => {
  return buildBatch(ctx, 'SITISFIA', 'SFIA', pad(ctx.sequence, 4), 'SFIA', (r) => [
    `H^SFIA${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^Z${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFIA^Q4`,
    `L^SFIA${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^Z${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS270`,
  ])
}

module.exports = {
  createSFI23
}
