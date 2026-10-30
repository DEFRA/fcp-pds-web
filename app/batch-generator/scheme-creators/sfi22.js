const { buildBatch, pad, dateString, lastDigits } = require('./helpers')

const createSFI22 = (ctx) => {
  return buildBatch(ctx, 'SITISFI', 'SFI', pad(ctx.sequence, 4), 'SFI', (r) => [
    `H^SFI${pad(r.invoiceNumber, 8)}^${pad(r.requestNumber, 2)}^${lastDigits(r.frn, 8)}^${r.requestNumber === 1 ? 1 : 2}^${r.frn}^GBP^${String(r.invoiceValue)}^${r.deliveryBody}^GBP^SFI^Q4`,
    `L^SFI${pad(r.invoiceNumber, 8)}^${String(r.invoiceValue)}^${r.schemeYear}^80101^DRD10^${lastDigits(r.frn, 8)}^${r.deliveryBody}^N^1^G00 - Gross value of claim^${dateString(new Date(r.schemeYear, 11, 1))}^${dateString(new Date(r.schemeYear, 11, 1))}^SOS270`,
  ])
}

module.exports = {
  createSFI22
}
