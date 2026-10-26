const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const createSFI26 = (ctx) => {
  return buildBatch(ctx, 'SITISFI26', 'SFI26', pad(ctx.sequence, 4), 'SFI26', (r) => [
    `H^SFI26${pad(r.invoiceNumber, 7)}^${pad(r.requestNumber, 2)}^G${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFI26^Q4`,
    `L^SFI26${pad(r.invoiceNumber, 7)}^${String(r.invoiceValue)}^${r.schemeYear}^80201^DRD10^G${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS270`,
  ])
}

module.exports = {
  createSFI26
}
